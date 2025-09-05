import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Image as ImageIcon, Video, Music, File } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  mediaPreview: string;
  onSend: (message: string) => void;
  onCancel: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  mediaPreview,
  onSend,
  onCancel
}) => {
  const [messageText, setMessageText] = useState('');


  // Reset message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessageText('');
    }
  }, [isOpen]);

  if (!isOpen || !file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaTypeIcon = () => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (file.type.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
    return <FileText className="w-6 h-6 text-orange-500" />;
  };

  const getMediaTypeLabel = () => {
    if (file.type.startsWith('image/')) return 'Imagem';
    if (file.type.startsWith('video/')) return 'Vídeo';
    if (file.type.startsWith('audio/')) return 'Áudio';
    return 'Documento';
  };

  const handleSend = () => {
    // Enviar mídia mesmo sem mensagem (mensagem é opcional)
    onSend(messageText);
    setMessageText('');
    onClose();
  };

  const handleClose = () => {
    setMessageText('');
    onClose();
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isDocument = !isImage && !isVideo && !isAudio;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {getMediaTypeIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enviar {getMediaTypeLabel()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* File Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {isDocument ? (
                <File className="w-8 h-8 text-blue-500" />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                onClick={() => window.open(mediaPreview, '_blank')}
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors"
                title="Visualizar em nova aba"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Media Preview */}
            {mediaPreview && (
              <div className="flex justify-center">
                {isImage && (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-w-full max-h-96 rounded-lg shadow-lg object-contain"
                  />
                )}
                {isVideo && (
                  <video
                    src={mediaPreview}
                    className="max-w-full max-h-96 rounded-lg shadow-lg"
                    controls
                    preload="metadata"
                  />
                )}
                {isAudio && (
                  <audio
                    src={mediaPreview}
                    className="w-full"
                    controls
                    preload="metadata"
                  />
                )}
              </div>
            )}

            {/* Message Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Adicionar mensagem (opcional)
              </label>
              <div className="flex items-end space-x-2 w-full">
                <div className="flex-1 relative min-w-0">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Digite uma mensagem para enviar junto..."
                    rows={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden"
                    style={{ minHeight: '36px', maxHeight: '100px' }}
                    autoFocus={true}
                  />
                </div>
                <button
                  onClick={handleSend}
                  className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors duration-200"
                  title="Enviar mídia"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
