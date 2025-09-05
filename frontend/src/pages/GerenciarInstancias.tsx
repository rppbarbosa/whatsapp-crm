import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  QrCode, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  Square, 
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { whatsappApi } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import QRCodeDisplay from '../components/QRCodeDisplay';

interface InstanceStatus {
  instanceName: string;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  phone?: string;
  qrCode?: string;
  isAuthenticated: boolean;
  createdAt?: string;
}

const GerenciarInstancias: React.FC = () => {
  const [instanceStatus, setInstanceStatus] = useState<InstanceStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrUpdateInterval, setQrUpdateInterval] = useState<NodeJS.Timeout | null>(null);
  const [pageActive, setPageActive] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);

  // WebSocket desabilitado - usando API REST
  const wsConnected = false;
  const wsError = false;
  const connectionStatus = 'disconnected';

  // 🔒 CONTROLE DE CICLO DE VIDA: Detectar quando usuário sai da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageActive(!document.hidden);
    };

    const handleBeforeUnload = () => {
      // Usuário está saindo da página
      cleanupOnPageExit();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupOnPageExit();
    };
  }, []);

  // 🔒 LIMPEZA INTELIGENTE: Só fecha se não foi autenticada
  const cleanupOnPageExit = useCallback(async () => {
    if (instanceStatus && !instanceStatus.isAuthenticated) {
      console.log('🧹 Usuário saiu da página, limpando instância não autenticada...');
      try {
        await whatsappApi.cleanupInstance(instanceStatus.instanceName);
        console.log('✅ Instância limpa com sucesso');
      } catch (error) {
        console.error('❌ Erro ao limpar instância:', error);
      }
    } else if (instanceStatus && instanceStatus.isAuthenticated) {
      console.log('✅ Instância autenticada, mantendo ativa');
    }
  }, [instanceStatus]);

  // Carregar status inicial da instância
  const loadInstanceStatus = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📱 Carregando status da instância...');
      
      const response = await whatsappApi.getInstanceStatus();
      
      if (response.data.success && response.data.instance) {
        const instance = response.data.instance;
        console.log('📱 Status da instância carregado:', instance);
        
        setInstanceStatus(instance);
        
        // 🔄 Gerenciar atualização automática baseado no status
        if (instance.status === 'qr_ready') {
          startQRAutoUpdate();
        } else if (instance.status === 'connected') {
          // Se conectado, parar atualização do QR
          stopQRAutoUpdate();
        }
      } else {
        console.log('📱 Nenhuma instância ativa encontrada');
        setInstanceStatus(null);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar status da instância:', error);
      setInstanceStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar status ao montar componente
  useEffect(() => {
    loadInstanceStatus();
  }, [loadInstanceStatus]);

  // 🔄 Polling de status para detectar mudanças (especialmente quando conecta)
  useEffect(() => {
    if (!instanceStatus || instanceStatus.status === 'connected') {
      return; // Não fazer polling se já conectado
    }

    const statusInterval = setInterval(() => {
      console.log('🔄 Verificando status da instância...');
      loadInstanceStatus();
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(statusInterval);
  }, [instanceStatus, loadInstanceStatus]);

  // 🔄 SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA DO QR CODE
  const startQRAutoUpdate = useCallback(() => {
    if (qrUpdateInterval) {
      clearInterval(qrUpdateInterval);
    }

    const interval = setInterval(async () => {
      if (instanceStatus?.status === 'qr_ready' && pageActive) {
        console.log('🔄 Atualizando QR code automaticamente...');
        await refreshQRCode();
      }
    }, 30000); // 30 segundos

    setQrUpdateInterval(interval);
    console.log('✅ Atualização automática do QR code iniciada (30s)');
  }, [instanceStatus?.status, pageActive]);

  const stopQRAutoUpdate = useCallback(() => {
    if (qrUpdateInterval) {
      clearInterval(qrUpdateInterval);
      setQrUpdateInterval(null);
      console.log('⏹️ Atualização automática do QR code parada');
    }
  }, [qrUpdateInterval]);

  // Criar nova instância
  const createNewInstance = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🆕 Criando nova instância...');
      
      const response = await whatsappApi.createInstance({ 
        instanceName: 'whatsapp-crm-instance' 
      });
      
      // Verificar se a resposta tem a propriedade success
      if (response.data && (response.data as any).success) {
        toast.success('✅ Instância criada com sucesso!');
        
        // Aguardar um pouco e recarregar status
        setTimeout(() => {
          loadInstanceStatus();
        }, 2000);
      } else {
        toast.error('❌ Erro ao criar instância');
      }
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      toast.error('❌ Erro ao criar instância');
    } finally {
      setLoading(false);
    }
  }, [loadInstanceStatus]);

  // Atualizar QR code
  const refreshQRCode = useCallback(async () => {
    try {
      if (!instanceStatus) return;
      
      const response = await whatsappApi.refreshQRCode();
      
      if (response.data && (response.data as any).success) {
        console.log('🔄 QR code atualizado');
        await loadInstanceStatus(); // Recarregar status
      } else {
        console.error('❌ Erro ao atualizar QR code');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar QR code:', error);
    }
  }, [instanceStatus, loadInstanceStatus]);

  // Parar instância
  const stopInstance = useCallback(async () => {
    try {
      if (!instanceStatus) return;
      
      setLoading(true);
      
      if (instanceStatus.isAuthenticated) {
        // 🔒 Se foi autenticada, perguntar se quer forçar parada
        if (window.confirm('Esta instância está autenticada. Deseja forçar a parada?')) {
          await whatsappApi.forceStopInstance(instanceStatus.instanceName);
          toast.success('🛑 Instância parada forçadamente');
        } else {
          toast.success('ℹ️ Instância mantida ativa');
          return;
        }
      } else {
        // Se não foi autenticada, pode parar normalmente
        await whatsappApi.cleanupInstance(instanceStatus.instanceName);
        toast.success('🛑 Instância parada com sucesso');
      }
      
      setInstanceStatus(null);
      stopQRAutoUpdate();
      
    } catch (error) {
      console.error('❌ Erro ao parar instância:', error);
      toast.error('❌ Erro ao parar instância');
    } finally {
      setLoading(false);
    }
  }, [instanceStatus, stopQRAutoUpdate]);


  // Renderizar estado inicial (sem QR code)
  if (!instanceStatus) {
    return (
      <div ref={pageRef} className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Smartphone className="w-12 h-12 text-gray-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Gerenciar Instâncias WhatsApp
            </h1>
            
            <p className="text-gray-600 mb-8 text-lg">
              Clique em "Gerar QR Code" para iniciar uma instância
            </p>
            
            <button
              onClick={createNewInstance}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Gerar QR Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado com instância ativa
  return (
    <div ref={pageRef} className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Instância: {instanceStatus.instanceName}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                {instanceStatus.status === 'connected' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 font-medium">Conectado</span>
                    {instanceStatus.phone && (
                      <span className="text-gray-500">• {instanceStatus.phone}</span>
                    )}
                  </>
                )}
                {instanceStatus.status === 'qr_ready' && (
                  <>
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">Aguardando QR Code</span>
                  </>
                )}
                {instanceStatus.status === 'connecting' && (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-blue-600 font-medium">Conectando...</span>
                  </>
                )}
                {instanceStatus.status === 'error' && (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 font-medium">Erro</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              {instanceStatus.status === 'qr_ready' && (
                <button
                  onClick={refreshQRCode}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar QR</span>
                </button>
              )}
              
              <button
                onClick={stopInstance}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Parar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo principal baseado no status */}
        {instanceStatus.status === 'qr_ready' && instanceStatus.qrCode && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Escaneie o QR Code
            </h2>
            
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
              <QRCodeDisplay 
                qrCode={instanceStatus.qrCode} 
                size={256}
              />
            </div>
            
            <p className="text-gray-600 mb-4">
              Abra o WhatsApp no seu celular e escaneie este QR Code
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Atualizando automaticamente a cada 30 segundos...</span>
            </div>
          </div>
        )}

        {instanceStatus.status === 'connected' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              WhatsApp Conectado!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Sua instância está funcionando perfeitamente
            </p>
            
            {instanceStatus.phone && (
              <div className="bg-gray-50 rounded-lg p-4 inline-block">
                <span className="text-gray-700 font-medium">
                  Número: {instanceStatus.phone}
                </span>
              </div>
            )}
          </div>
        )}

        {instanceStatus.status === 'error' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Erro na Instância
            </h2>
            
            <p className="text-gray-600 mb-6">
              Ocorreu um erro ao conectar com o WhatsApp
            </p>
            
            <button
              onClick={createNewInstance}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciarInstancias;
