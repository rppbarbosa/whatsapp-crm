import React from 'react';
import { Link } from 'react-router-dom';

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error' | 'initializing';
  isReady: boolean;
  qrCode?: string;
  phone?: string;
}

interface StatusBarProps {
  status: WhatsAppStatus;
}

export const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const getStatusColor = () => {
    switch (status.status) {
      case 'connected': return 'text-green-600';
      case 'qr_ready': return 'text-yellow-600';
      case 'connecting': 
      case 'initializing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected': return 'Conectado';
      case 'qr_ready': return 'Aguardando QR Code';
      case 'connecting': return 'Conectando...';
      case 'initializing': return 'Inicializando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-medium text-gray-900">WhatsApp CRM</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              status.isReady ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {status.phone && (
              <span className="text-sm text-gray-500">({status.phone})</span>
            )}
          </div>
        </div>
        {!status.isReady && (
          <Link
            to="/gerenciar-instancias"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Gerenciar Instâncias
          </Link>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
