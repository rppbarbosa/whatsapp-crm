import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  QrCode, 
  Wifi,
  WifiOff
} from 'lucide-react';
import { whatsappApi, WhatsAppInstance } from '../services/api';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

const WhatsAppManager: React.FC = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({});
  const [loadingQR, setLoadingQR] = useState<{[key: string]: boolean}>({});

  // Carregar instâncias
  const loadInstances = async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.getInstances();
      
      // Garantir que temos um array válido
      const instancesData = response.data?.data || [];
      console.log('📱 Instâncias carregadas:', instancesData.length);
      
      setInstances(instancesData);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias');
      setInstances([]); // Garantir que seja um array vazio
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status das instâncias manualmente
  const refreshInstances = async () => {
    try {
      setLoading(true);
      toast('Atualizando status das instâncias...');
      await loadInstances();
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar instâncias:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  // Criar instância
  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    try {
      setCreating(true);
      await whatsappApi.createInstance({ instanceName: instanceName.trim() });
      setInstanceName('');
      toast.success('Instância criada com sucesso!');
      loadInstances();
    } catch (error: any) {
      console.error('Erro ao criar instância:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar instância');
    } finally {
      setCreating(false);
    }
  };

  // Obter QR code da instância
  const getQRCode = async (instanceName: string) => {
    try {
      setLoadingQR(prev => ({ ...prev, [instanceName]: true }));
      const response = await whatsappApi.getQRCode(instanceName);
      
      if (response.data?.data?.qrcode) {
        setQrCodes(prev => ({ ...prev, [instanceName]: response.data.data.qrcode }));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Erro ao obter QR code:', error);
      return null;
    } finally {
      setLoadingQR(prev => ({ ...prev, [instanceName]: false }));
    }
  };

  // Deletar instância
  const deleteInstance = async (instanceName: string) => {
    // Validar se o instanceName é válido
    if (!instanceName || instanceName === 'undefined' || instanceName.trim() === '') {
      console.error('❌ Instance name inválido:', instanceName);
      toast.error('Nome da instância inválido');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja deletar a instância "${instanceName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deletando instância:', instanceName);
      await whatsappApi.deleteInstance(instanceName);

      // Atualização otimista: remover imediatamente do estado local
      setInstances(prev => prev.filter(inst => inst.instance_name !== instanceName));
      setQrCodes(prev => { const copy = { ...prev }; delete copy[instanceName]; return copy; });
      setLoadingQR(prev => { const copy = { ...prev }; delete copy[instanceName]; return copy; });

      toast.success('Instância deletada com sucesso!');

      // Sincronizar com backend (defasagem eventual)
      loadInstances();
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast.error(error.response?.data?.message || 'Erro ao deletar instância');
    }
  };

  // Conectar instância
  const connectInstance = async (instanceName: string) => {
    try {
      await whatsappApi.connectInstance(instanceName);
      toast.success('Instância conectada com sucesso!');
      loadInstances();
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      toast.error(error.response?.data?.message || 'Erro ao conectar instância');
    }
  };

  // Carregar instâncias na inicialização
  useEffect(() => {
    loadInstances();
  }, []);

  // Polling automático enquanto houver instâncias conectando
  useEffect(() => {
    const hasConnecting = instances.some((i) => i.status === 'connecting');
    if (!hasConnecting) return;

    const interval = setInterval(async () => {
      const resp = await whatsappApi.getInstances();
      const list = resp.data?.data || [];

      // Se alguma mudou para connected, limpar QR local
      const newlyConnected = list.filter((i: WhatsAppInstance) => i.status === 'connected');
      if (newlyConnected.length > 0) {
        setQrCodes((prev) => {
          const copy = { ...prev };
          newlyConnected.forEach((i) => delete copy[i.instance_name]);
          return copy;
        });
      }

      setInstances(list);
    }, 2000);

    return () => clearInterval(interval);
  }, [instances]);

  // Calcular estatísticas
  const stats = {
    total: instances.length,
    connected: instances.filter(inst => inst.status === 'connected').length,
    connecting: instances.filter(inst => inst.status === 'connecting').length,
    disconnected: instances.filter(inst => inst.status === 'disconnected').length
  };

  // Funções auxiliares para status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <Smartphone className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'connecting':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp CRM Manager</h1>
            <p className="text-gray-600 mt-1">Gerencie suas instâncias do WhatsApp</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={refreshInstances}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Instâncias</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Smartphone className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conectadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.connected}</p>
              </div>
              <Wifi className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conectando</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.connecting}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Desconectadas</p>
                <p className="text-3xl font-bold text-red-600">{stats.disconnected}</p>
              </div>
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Criar Instância */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Criar Instância
          </h3>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Digite o nome da instância (ex: whatsapp-crm)"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createInstance()}
              className="input flex-1"
              disabled={creating}
            />
            <button
              onClick={createInstance}
              disabled={creating || !instanceName.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <div className="loading-spinner" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Criar Instância
                </>
              )}
            </button>
          </div>
        </div>

        {/* Lista de Instâncias */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Instâncias
            </h3>
            <button
              onClick={loadInstances}
              disabled={loading}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          {instances.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma instância encontrada. Crie uma para começar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => {
                // Validar se a instância tem dados válidos
                if (!instance || !instance.instance_name) {
                  console.warn('⚠️ Instância inválida:', instance);
                  return null;
                }
                
                return (
                  <div key={instance.instance_name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {instance.instance_name}
                          </h4>
                          {instance.phone_number && (
                            <p className="text-sm text-gray-500">
                              📱 {instance.phone_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(instance.status)}`}>
                          {getStatusIcon(instance.status)}
                          <span className="ml-1 capitalize">{instance.status}</span>
                        </span>
                        <button
                          onClick={() => deleteInstance(instance.instance_name)}
                          className="btn-danger p-2"
                          title={`Deletar instância ${instance.instance_name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {instance.status === 'connecting' && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <QrCode className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Escaneie este QR Code com o WhatsApp:
                          </span>
                          <button
                            onClick={() => getQRCode(instance.instance_name)}
                            disabled={loadingQR[instance.instance_name]}
                            className="ml-auto text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            {loadingQR[instance.instance_name] ? 'Carregando...' : 'Atualizar QR'}
                          </button>
                        </div>
                        <div className="text-center">
                          {qrCodes[instance.instance_name] ? (
                            <img
                              src={qrCodes[instance.instance_name]}
                              alt="QR Code"
                              className="mx-auto max-w-48 rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="animate-pulse bg-gray-200 rounded-lg w-48 h-48 mx-auto flex items-center justify-center">
                              <span className="text-gray-500">
                                {loadingQR[instance.instance_name] ? 'Carregando QR Code...' : 'Clique em "Atualizar QR" para gerar'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2">
                      {instance.status === 'connecting' && (
                        <button
                          onClick={() => connectInstance(instance.instance_name)}
                          className="btn-success flex items-center gap-2"
                        >
                          <Wifi className="w-4 h-4" />
                          Conectar
                        </button>
                      )}
                      {instance.status === 'connected' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Conectado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppManager; 