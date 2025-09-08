import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  QrCode, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  Square, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import QRCodeDisplay from '../components/QRCodeDisplay';

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  isReady: boolean;
  qrCode?: string;
  phone?: string;
}

const GerenciarInstanciasSimple: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false
  });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_KEY = process.env.REACT_APP_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

  // Carregar status do WhatsApp
  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Inicializar WhatsApp
  const initializeWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('WhatsApp inicializado!');
          await loadStatus();
        } else {
          toast.error('Erro ao inicializar WhatsApp');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      toast.error('Erro ao inicializar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Desconectar WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('WhatsApp desconectado!');
          setStatus({
            status: 'disconnected',
            isReady: false
          });
        }
      }
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadStatus();
  }, []);

  // Atualizar status periodicamente apenas quando não conectado
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Só fazer polling se não estiver conectado
    if (status.status !== 'connected') {
      interval = setInterval(() => {
        loadStatus();
      }, 10000); // Reduzido para 10 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.status]);

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected': return 'text-green-600';
      case 'qr_ready': return 'text-yellow-600';
      case 'connecting': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected': return 'Conectado';
      case 'qr_ready': return 'Aguardando QR Code';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'qr_ready': return <QrCode className="w-5 h-5 text-yellow-600" />;
      case 'connecting': return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Instâncias WhatsApp</h1>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusIcon()}
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                {status.phone && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">({status.phone})</span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {status.status === 'disconnected' && (
                <button
                  onClick={initializeWhatsApp}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Conectar</span>
                </button>
              )}
              {status.status === 'qr_ready' && (
                <button
                  onClick={loadStatus}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar</span>
                </button>
              )}
              {status.status === 'connected' && (
                <button
                  onClick={disconnectWhatsApp}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>Desconectar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {status.status === 'qr_ready' && status.qrCode ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Escaneie o QR Code
              </h3>
              <QRCodeDisplay qrCode={status.qrCode} size={256} />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Abra o WhatsApp no seu celular e escaneie este QR Code
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instruções:</strong>
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 text-left max-w-md mx-auto">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Toque em "Menu" ou "Configurações"</li>
                  <li>3. Toque em "Dispositivos conectados"</li>
                  <li>4. Toque em "Conectar um dispositivo"</li>
                  <li>5. Escaneie este QR Code</li>
                </ol>
              </div>
            </div>
          ) : status.isReady ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp Conectado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Pronto para enviar e receber mensagens
              </p>
              {status.phone && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Número conectado:</strong> {status.phone}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                WhatsApp Desconectado
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Clique em "Conectar" para iniciar uma nova instância
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Funcionalidades disponíveis após conectar:</strong>
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-left max-w-md mx-auto">
                  <li>• Enviar e receber mensagens</li>
                  <li>• Gerenciar conversas</li>
                  <li>• Sincronizar contatos</li>
                  <li>• Acessar histórico de mensagens</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informações da Instância
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status:</p>
              <p className={`font-medium ${getStatusColor()}`}>{getStatusText()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Número:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {status.phone || 'Não conectado'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Última atualização:</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">API Status:</p>
              <p className="font-medium text-green-600 dark:text-green-400">Online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciarInstanciasSimple;
