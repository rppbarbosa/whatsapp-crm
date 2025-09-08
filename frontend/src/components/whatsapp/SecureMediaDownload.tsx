import React, { useState } from 'react';
import { Download, FileImage, FileVideo, FileAudio, File, AlertTriangle, ArrowLeft, X } from 'lucide-react';

export interface MediaInfo {
  type: string;
  hasMedia: boolean;
  filename?: string;
  mimetype?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  url?: string;
  error?: string;
}

interface SecureMediaDownloadProps {
  mediaInfo: MediaInfo;
  isFromMe: boolean;
  caption?: string;
}

export const SecureMediaDownload: React.FC<SecureMediaDownloadProps> = ({
  mediaInfo,
  isFromMe,
  caption
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se uma string é base64
  const isBase64String = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    // Verificar se é uma string base64 longa (mais de 100 caracteres)
    if (str.length > 100 && /^[A-Za-z0-9+/]+=*$/.test(str)) {
      return true;
    }
    // Verificar se contém padrões típicos de base64 de imagem
    if (str.includes('/9j/4AAQ') || str.includes('iVBORw0KGgo')) {
      return true;
    }
    return false;
  };

  // Validar e sanitizar nome do arquivo
  const sanitizeFilename = (filename: string): string => {
    // Se não há filename, criar um genérico
    if (!filename) {
      const extension = getFileExtension(mediaInfo.mimetype || '');
      return `arquivo_${Date.now()}.${extension}`;
    }
    
    // Se o filename contém o padrão de ID do WhatsApp, criar nome mais amigável
    if (filename.includes('media_') && filename.includes('@c.us_')) {
      const extension = filename.split('.').pop() || getFileExtension(mediaInfo.mimetype || '');
      const timestamp = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/[^\d]/g, '');
      return `imagem_${timestamp}.${extension}`;
    }
    
    // Se o filename é muito longo, encurtar mas preservar extensão
    if (filename.length > 50) {
      const lastDot = filename.lastIndexOf('.');
      const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
      const extension = lastDot > 0 ? filename.substring(lastDot + 1) : getFileExtension(mediaInfo.mimetype || '');
      
      // Encurtar nome mas preservar caracteres especiais importantes
      const shortName = name.substring(0, 40);
      return `${shortName}.${extension}`;
    }
    
    // Para nomes normais, apenas sanitizar caracteres problemáticos
    const sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_') // Apenas caracteres que causam problemas no Windows
      .substring(0, 100);
    
    // Garantir que tenha extensão válida
    if (!sanitized.includes('.')) {
      const extension = getFileExtension(mediaInfo.mimetype || '');
      return `${sanitized}.${extension}`;
    }
    
    return sanitized;
  };

  // Obter extensão baseada no MIME type
  const getFileExtension = (mimetype: string): string => {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    
    return mimeMap[mimetype] || 'bin';
  };

  // Obter ícone baseado no tipo de mídia
  const getMediaIcon = () => {
    switch (mediaInfo.type) {
      case 'image':
        return <FileImage className="w-8 h-8 text-blue-500" />;
      case 'video':
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      case 'audio':
      case 'ptt':
        return <FileAudio className="w-8 h-8 text-green-500" />;
      case 'document':
        return <File className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Tamanho desconhecido';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Formatar duração para áudios/vídeos
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Download seguro do arquivo
  const handleDownload = async () => {
    if (!mediaInfo.url) {
      setError('URL da mídia não disponível');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Validar se é base64 válido
      if (!mediaInfo.url.startsWith('data:') && !mediaInfo.url.match(/^[A-Za-z0-9+/]+=*$/)) {
        throw new Error('Formato de mídia inválido');
      }

      // Criar nome do arquivo seguro
      const filename = sanitizeFilename(
        mediaInfo.filename || 
        `media_${Date.now()}.${getFileExtension(mediaInfo.mimetype || '')}`
      );

      // Converter base64 para blob
      let blob: Blob;
      if (mediaInfo.url.startsWith('data:')) {
        const response = await fetch(mediaInfo.url);
        blob = await response.blob();
      } else {
        // Assumir que é base64 puro
        const mimeType = mediaInfo.mimetype || 'application/octet-stream';
        const byteCharacters = atob(mediaInfo.url);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      }

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Adicionar ao DOM temporariamente e clicar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Erro ao baixar mídia:', err);
      setError('Erro ao baixar arquivo. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Preview seguro (apenas para imagens pequenas)
  const handlePreview = () => {
    if (mediaInfo.type === 'image' && mediaInfo.url) {
      setShowPreview(true);
    }
  };


  return (
    <div className="mb-2">
      <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-sm ${isFromMe ? 'order-2' : 'order-1'}`}>
          {/* Container principal da mídia */}
          <div className="relative group">
            {/* Preview da imagem/documento */}
            {mediaInfo.type === 'image' && mediaInfo.url ? (
              <div 
                className="relative cursor-pointer rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
                onClick={handlePreview}
              >
                <img
                  src={mediaInfo.url.startsWith('data:') 
                    ? mediaInfo.url 
                    : `data:${mediaInfo.mimetype};base64,${mediaInfo.url}`}
                  alt={mediaInfo.filename || 'Imagem'}
                  className="w-full h-auto max-h-80 object-cover hover:opacity-90 transition-opacity"
                />
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-end">
                  <div className="w-full p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {sanitizeFilename(mediaInfo.filename || `imagem.${getFileExtension(mediaInfo.mimetype || '')}`)}
                        </p>
                        <p className="text-xs opacity-75">{formatFileSize(mediaInfo.size)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload();
                        }}
                        className="ml-2 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-colors"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Preview para documentos não-imagem */
              <div 
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={handlePreview}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getMediaIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {sanitizeFilename(mediaInfo.filename || `arquivo.${getFileExtension(mediaInfo.mimetype || '')}`)}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(mediaInfo.size)}</span>
                      {mediaInfo.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(mediaInfo.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Caption abaixo da mídia - apenas se não for base64 */}
            {caption && !isBase64String(caption) && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 px-1">
                {caption}
              </p>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de preview para imagens - Estilo WhatsApp */}
      {showPreview && mediaInfo.type === 'image' && mediaInfo.url && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Imagem centralizada */}
            <img
              src={mediaInfo.url.startsWith('data:') 
                ? mediaInfo.url 
                : `data:${mediaInfo.mimetype};base64,${mediaInfo.url}`}
              alt={mediaInfo.filename || 'Imagem'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Header com informações e botões */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="text-white">
                    <p className="text-sm font-medium">
                      {sanitizeFilename(mediaInfo.filename || `imagem.${getFileExtension(mediaInfo.mimetype || '')}`)}
                    </p>
                    <p className="text-xs opacity-75">{formatFileSize(mediaInfo.size)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload();
                    }}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
