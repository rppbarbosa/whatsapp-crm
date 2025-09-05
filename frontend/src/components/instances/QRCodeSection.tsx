import React from 'react';
import {
  QrCode,
  RefreshCw,
  Play
} from 'lucide-react';
import QRCodeDisplay from '../QRCodeDisplay';

interface QRCodeSectionProps {
  qrCodeData: string;
  generatingQR: boolean;
  lastQRGeneration: Date | null;
  autoRefreshInterval: NodeJS.Timeout | null;
  timeUntilNextRefresh: number;
  onGenerateNewQR: () => void;
  onConnect: () => void;
  instanceStatus: string;
}

const QRCodeSection: React.FC<QRCodeSectionProps> = ({
  qrCodeData,
  generatingQR,
  lastQRGeneration,
  autoRefreshInterval,
  timeUntilNextRefresh,
  onGenerateNewQR,
  onConnect,
  instanceStatus
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Disponível</h3>
        <p className="text-gray-600 mb-6">Escaneie o QR code com seu WhatsApp para conectar</p>
        
        {/* Área do QR Code */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
          {qrCodeData ? (
            <div className="text-center">
              <QRCodeDisplay 
                qrCode={qrCodeData} 
                size={192}
                className="mx-auto"
              />
              <p className="text-sm text-green-600 font-medium mt-4">QR Code gerado com sucesso!</p>
              {lastQRGeneration && (
                <p className="text-xs text-gray-500 mt-1">
                  Gerado em: {lastQRGeneration.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando Novo QR Code...</p>
              <p className="text-sm text-gray-500">Aguarde, isso pode levar alguns segundos</p>
              <div className="flex justify-center mt-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGenerateNewQR}
            disabled={generatingQR}
            className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${generatingQR ? 'animate-spin' : ''}`} />
            <span>{generatingQR ? 'Gerando...' : 'Atualizar QR Code'}</span>
          </button>
          
          <button
            onClick={onConnect}
            disabled={instanceStatus === 'active'}
            className="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Conectar</span>
          </button>
        </div>
        
        {/* Status de Geração Automática */}
        {autoRefreshInterval && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center text-sm text-blue-800">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              <span>Atualização automática ativa (30s)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeSection;
