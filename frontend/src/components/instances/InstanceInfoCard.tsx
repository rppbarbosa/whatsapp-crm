import React from 'react';
import {
  Smartphone,
  Phone,
  Clock,
  Activity,
  Shield,
  Wifi,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon
} from 'lucide-react';

interface WhatsAppInstance {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive' | 'connecting' | 'disconnected' | 'error' | 'qr_ready';
  type: 'business' | 'personal';
  lastActivity: string;
  messageCount: number;
  contactCount: number;
  uptime: string;
  version: string;
  region: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  features: string[];
  alerts: string[];
  qrCode?: string;
}

interface InstanceInfoCardProps {
  instance: WhatsAppInstance;
}

const InstanceInfoCard: React.FC<InstanceInfoCardProps> = ({ instance }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Conectado' };
      case 'qr_ready':
        return { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: 'QR Code Pronto' };
      case 'connecting':
        return { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Conectando...' };
      case 'disconnected':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Desconectado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Desconhecido' };
    }
  };

  const statusInfo = getStatusInfo(instance.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Smartphone className="w-5 h-5 text-green-500 mr-2" />
          {instance.name}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
          <StatusIcon className="w-4 h-4 inline mr-1" />
          {statusInfo.text}
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-3 text-gray-400" />
          <span>{instance.phone} • Business</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-3 text-gray-400" />
          <span>Última atividade: {instance.lastActivity}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Activity className="w-4 h-4 mr-3 text-gray-400" />
          <span>Uptime: {instance.uptime}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-3 text-gray-400" />
          <span>Plano: {instance.plan}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Wifi className="w-4 h-4 mr-3 text-gray-400" />
          <span>Região: {instance.region}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Zap className="w-4 h-4 mr-3 text-gray-400" />
          <span>Versão: {instance.version}</span>
        </div>
      </div>
      
      {/* Recursos Disponíveis */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Recursos Disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          {instance.features.map((feature, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstanceInfoCard;
