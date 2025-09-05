import React from 'react';
import { CheckCircle, Clock, Wifi, AlertCircle } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface ConnectionStatusProps {
  status: string;
  error: string | null;
  qrCode: string | null;
}

export default function ConnectionStatus({ status, error, qrCode }: ConnectionStatusProps) {
  // Determinar passo atual
  const getActiveStep = () => {
    switch (status) {
      case 'connecting':
        return 0;
      case 'waiting_qr':
        return 1;
      case 'scanning_qr':
        return 2;
      case 'connected':
        return 3;
      default:
        return -1;
    }
  };

  // Definir passos
  const steps = [
    {
      label: 'Iniciando conexão',
      description: 'Estabelecendo conexão com o WhatsApp...',
      icon: Clock,
    },
    {
      label: 'Gerando QR Code',
      description: 'Aguardando QR Code...',
      icon: Clock,
    },
    {
      label: 'Aguardando escaneamento',
      description: 'Escaneie o QR Code com seu WhatsApp',
      icon: Wifi,
    },
    {
      label: 'Conexão estabelecida',
      description: 'WhatsApp conectado com sucesso!',
      icon: CheckCircle,
    },
  ];

  const activeStep = getActiveStep();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isCompleted = index < activeStep || (index === activeStep && status === 'connected');
          const isError = status === 'error' && index === activeStep;
          
          return (
            <div key={step.label} className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isActive 
                    ? isError 
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </h3>
                
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    {isActive && status !== 'connected' && status !== 'error' && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <p className="text-sm text-gray-600">
                      {index === 0 && status === 'connecting' && 'Estabelecendo conexão com o WhatsApp...'}
                      {index === 1 && status === 'waiting_qr' && (qrCode ? 'QR Code gerado' : 'Aguardando QR Code...')}
                      {index === 2 && status === 'scanning_qr' && 'Escaneie o QR Code com seu WhatsApp'}
                      {index === 3 && status === 'connected' && 'WhatsApp conectado com sucesso!'}
                      {!isActive && step.description}
                    </p>
                  </div>
                </div>

                {/* Mostrar QR Code */}
                {qrCode && index === 2 && activeStep >= 1 && (
                  <div className="mt-4 text-center bg-gray-50 rounded-lg p-4">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <QRCodeDisplay 
                        qrCode={qrCode} 
                        size={192}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Abra o WhatsApp → Menu (⋮) → Aparelhos conectados → Conectar um aparelho
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Erro: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
}