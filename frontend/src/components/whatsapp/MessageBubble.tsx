import React from 'react';
import { cn } from '../../utils/cn';
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export interface MessageBubbleProps {
  message: string;
  timestamp: Date;
  isFromMe: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'error';
  type?: 'text' | 'image' | 'video' | 'document' | 'audio';
  mediaUrl?: string;
  mediaName?: string;
  onMediaClick?: () => void;
}

const getStatusIcon = (status: string, isFromMe: boolean) => {
  if (!isFromMe) return null;

  switch (status) {
    case 'sent':
      return <CheckIcon className="w-4 h-4 text-gray-400" />;
    case 'delivered':
      return <CheckIcon className="w-4 h-4 text-blue-500" />;
    case 'read':
      return <CheckCircleIcon className="w-4 h-4 text-blue-600" />;
    case 'error':
      return <CheckIcon className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  timestamp,
  isFromMe,
  status = 'sent',
  type = 'text',
  mediaUrl,
  mediaName,
  onMediaClick,
}) => {
  const renderContent = () => {
    if (type === 'text') {
      return (
        <div className="whitespace-pre-wrap break-words">
          {message}
        </div>
      );
    }

    if (type === 'image' && mediaUrl) {
      return (
        <div className="space-y-2">
          <img
            src={mediaUrl}
            alt="Imagem"
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={onMediaClick}
          />
          {message && (
            <div className="whitespace-pre-wrap break-words">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'video' && mediaUrl) {
      return (
        <div className="space-y-2">
          <video
            src={mediaUrl}
            controls
            className="max-w-xs rounded-lg"
          />
          {message && (
            <div className="whitespace-pre-wrap break-words">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'document' && mediaUrl) {
      return (
        <div className="space-y-2">
          <div
            className="flex items-center p-3 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
            onClick={onMediaClick}
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {mediaName || 'Documento'}
              </p>
            </div>
          </div>
          {message && (
            <div className="whitespace-pre-wrap break-words">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'audio' && mediaUrl) {
      return (
        <div className="space-y-2">
          <audio
            src={mediaUrl}
            controls
            className="max-w-xs"
          />
          {message && (
            <div className="whitespace-pre-wrap break-words">
              {message}
            </div>
          )}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap break-words">{message}</div>;
  };

  return (
    <div
      className={cn(
        'flex w-full mb-2',
        isFromMe ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-3 py-2 rounded-lg',
          isFromMe
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        )}
      >
        {renderContent()}
        <div
          className={cn(
            'flex items-center justify-end mt-1 text-xs',
            isFromMe ? 'text-primary-100' : 'text-gray-500'
          )}
        >
          <span>{formatTime(timestamp)}</span>
          {getStatusIcon(status, isFromMe)}
        </div>
      </div>
    </div>
  );
}; 