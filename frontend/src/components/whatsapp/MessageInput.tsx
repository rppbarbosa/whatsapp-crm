import React, { useState, useRef } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline';

export interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendMedia?: (file: File) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendMedia,
  onStartRecording,
  onStopRecording,
  placeholder = 'Digite uma mensagem...',
  disabled = false,
  loading = false,
  className,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !loading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendMedia) {
      onSendMedia(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording?.();
      setIsRecording(false);
    } else {
      onStartRecording?.();
      setIsRecording(true);
    }
  };

  const handleEmojiClick = () => {
    // TODO: Implementar picker de emojis
    console.log('Emoji picker not implemented yet');
  };

  return (
    <div className={cn('border-t border-gray-200 bg-white p-4', className)}>
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Botão de anexo */}
        {onSendMedia && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <PaperClipIcon className="w-5 h-5" />
          </Button>
        )}

        {/* Input de mensagem */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(
              'w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'min-h-[40px] max-h-32'
            )}
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '128px',
            }}
          />
        </div>

        {/* Botão de emoji */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleEmojiClick}
          disabled={disabled}
          className="flex-shrink-0"
        >
          <FaceSmileIcon className="w-5 h-5" />
        </Button>

        {/* Botão de gravação ou envio */}
        {message.trim() ? (
          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={disabled || loading || !message.trim()}
            loading={loading}
            className="flex-shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRecordingToggle}
            disabled={disabled}
            className={cn(
              'flex-shrink-0',
              isRecording && 'text-red-500 bg-red-50'
            )}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </Button>
        )}
      </form>

      {/* Input de arquivo oculto */}
      {onSendMedia && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="mt-2 flex items-center space-x-2 text-sm text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>Gravando...</span>
        </div>
      )}
    </div>
  );
}; 