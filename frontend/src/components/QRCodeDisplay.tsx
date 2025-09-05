import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  qrCode: string;
  size?: number;
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ 
  qrCode, 
  size = 200, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && qrCode) {
      try {
        console.log('🔄 Processando QR code...');
        console.log('📏 Tamanho do QR code:', qrCode.length);
        
        // Se for base64 do WPPConnect, usar diretamente como imagem
        if (qrCode.startsWith('data:image/')) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                canvas.width = size;
                canvas.height = size;
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(img, 0, 0, size, size);
                console.log('✅ QR code base64 renderizado');
              }
            }
          };
          img.onerror = (error) => {
            console.error('❌ Erro ao carregar imagem base64:', error);
          };
          img.src = qrCode;
        } else {
          // Para strings de texto, usar a biblioteca QRCode
          QRCode.toCanvas(canvasRef.current, qrCode, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) {
              console.error('❌ Erro ao gerar QR code:', error);
            } else {
              console.log('✅ QR code texto renderizado');
            }
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar QR code:', error);
      }
    }
  }, [qrCode, size]);

  if (!qrCode) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <span className="text-gray-500 text-sm">QR Code não disponível</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <canvas
        ref={canvasRef}
        className="border border-gray-300 rounded-lg"
        style={{ width: size, height: size }}
      />
      <p className="text-xs text-gray-600 text-center">
        Escaneie este QR code com seu WhatsApp
      </p>
    </div>
  );
};

export default QRCodeDisplay;
