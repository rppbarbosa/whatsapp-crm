import React, { useState } from 'react';
import { MediaInfo } from '../../services/apiSimple';

interface MediaMessageProps {
  mediaInfo: MediaInfo;
  isFromMe: boolean;
  caption?: string;
}

export const MediaMessage: React.FC<MediaMessageProps> = ({ mediaInfo, isFromMe, caption }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = () => {
    switch (mediaInfo.type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
      case 'ptt':
        return '🎵';
      case 'document':
        return '📄';
      case 'sticker':
        return '😊';
      default:
        return '📎';
    }
  };

  const renderImage = () => {
    if (imageError || !mediaInfo.url) {
      return (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4 min-h-[200px]">
          <div className="text-center">
            <div className="text-4xl mb-2">{getMediaIcon()}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {imageError ? 'Erro ao carregar imagem' : 'Imagem não disponível'}
            </p>
          </div>
        </div>
      );
    }

    // Determinar o tipo MIME correto
    const mimeType = mediaInfo.mimetype || 'image/jpeg';
    const imageSrc = mediaInfo.url.startsWith('data:') 
      ? mediaInfo.url 
      : `data:${mimeType};base64,${mediaInfo.url}`;

    return (
      <div className="relative">
        <img
          src={imageSrc}
          alt={mediaInfo.filename || 'Imagem'}
          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowFullImage(true)}
          onError={() => setImageError(true)}
        />
        {showFullImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullImage(false)}
          >
            <img
              src={imageSrc}
              alt={mediaInfo.filename || 'Imagem'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  };

  const renderVideo = () => {
    if (!mediaInfo.url) {
      return (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4 min-h-[200px]">
          <div className="text-center">
            <div className="text-4xl mb-2">{getMediaIcon()}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vídeo não disponível</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <video
          controls
          className="max-w-full h-auto rounded-lg"
          poster={mediaInfo.thumbnail ? `data:image/jpeg;base64,${mediaInfo.thumbnail}` : undefined}
        >
          <source src={`data:${mediaInfo.mimetype};base64,${mediaInfo.url}`} type={mediaInfo.mimetype} />
          Seu navegador não suporta o elemento de vídeo.
        </video>
        {mediaInfo.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(mediaInfo.duration)}
          </div>
        )}
      </div>
    );
  };

  const renderAudio = () => {
    if (!mediaInfo.url) {
      return (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4 min-h-[100px]">
          <div className="text-center">
            <div className="text-4xl mb-2">{getMediaIcon()}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Áudio não disponível</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getMediaIcon()}</div>
          <div className="flex-1">
            <audio controls className="w-full">
              <source src={`data:${mediaInfo.mimetype};base64,${mediaInfo.url}`} type={mediaInfo.mimetype} />
              Seu navegador não suporta o elemento de áudio.
            </audio>
            {mediaInfo.duration && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Duração: {formatDuration(mediaInfo.duration)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDocument = () => {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getMediaIcon()}</div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              {mediaInfo.filename || 'Documento'}
            </p>
            {mediaInfo.size && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(mediaInfo.size)}
              </p>
            )}
            {mediaInfo.mimetype && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {mediaInfo.mimetype}
              </p>
            )}
          </div>
          {mediaInfo.url && (
            <a
              href={`data:${mediaInfo.mimetype};base64,${mediaInfo.url}`}
              download={mediaInfo.filename || 'documento'}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
            >
              Baixar
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderMedia = () => {
    if (mediaInfo.error) {
      return (
        <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4 min-h-[100px]">
          <div className="text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Erro ao carregar mídia
            </p>
          </div>
        </div>
      );
    }

    switch (mediaInfo.type) {
      case 'image':
        return renderImage();
      case 'video':
        return renderVideo();
      case 'audio':
      case 'ptt':
        return renderAudio();
      case 'document':
        return renderDocument();
      case 'sticker':
        return renderImage(); // Stickers são tratados como imagens
      default:
        return (
          <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-4 min-h-[100px]">
            <div className="text-center">
              <div className="text-4xl mb-2">{getMediaIcon()}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tipo de mídia não suportado
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-xs">
      {renderMedia()}
      {caption && (
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {caption}
        </p>
      )}
    </div>
  );
};

export default MediaMessage;
