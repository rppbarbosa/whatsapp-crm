import React from 'react';
import { cn } from '../../utils/cn';
import { Check, CheckCircle } from 'lucide-react';

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
      return <Check className="w-4 h-4 text-gray-400" />;
    case 'delivered':
      return (
        <div className="flex">
          <Check className="w-4 h-4 text-blue-500" />
          <Check className="w-4 h-4 text-blue-500 -ml-1" />
        </div>
      );
    case 'read':
      return (
        <div className="flex">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <CheckCircle className="w-4 h-4 text-blue-600 -ml-1" />
        </div>
      );
    case 'error':
      return <Check className="w-4 h-4 text-red-500" />;
    default:
      return <Check className="w-4 h-4 text-gray-400" />;
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
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message}
        </div>
      );
    }

    if (type === 'image' && mediaUrl) {
      return (
        <div className="space-y-3">
          <div className="relative group">
            <img
              src={mediaUrl}
              alt="Imagem"
              className="max-w-xs rounded-2xl cursor-pointer hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              onClick={onMediaClick}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl transition-all duration-300"></div>
          </div>
          {message && (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'video' && mediaUrl) {
      return (
        <div className="space-y-3">
          <video
            src={mediaUrl}
            controls
            className="max-w-xs rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          />
          {message && (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'document' && mediaUrl) {
      return (
        <div className="space-y-3">
          <div
            className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
            onClick={onMediaClick}
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors duration-200">
                {mediaName || 'Documento'}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-200">PDF • 1 página • 112 KB</p>
            </div>
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-500 transition-colors duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {message && (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </div>
          )}
        </div>
      );
    }

    if (type === 'audio' && mediaUrl) {
      return (
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.076L4.33 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.33l4.383-3.076zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                <div className="w-1/2 h-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-medium">0:30</div>
          </div>
          {message && (
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </div>
          )}
        </div>
      );
    }

    return <div className="whitespace-pre-wrap break-words leading-relaxed">{message}</div>;
  };

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in slide-in-from-bottom-2 duration-300',
        isFromMe ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-4 py-3 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]',
          isFromMe
            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-2xl shadow-green-500/25'
            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 rounded-bl-2xl shadow-gray-500/10'
        )}
      >
        {renderContent()}
        <div
          className={cn(
            'flex items-center justify-end mt-3 text-xs space-x-2 font-medium',
            isFromMe ? 'text-green-100' : 'text-gray-500'
          )}
        >
          <span>{formatTime(timestamp)}</span>
          {getStatusIcon(status, isFromMe)}
        </div>
      </div>
    </div>
  );
}; 