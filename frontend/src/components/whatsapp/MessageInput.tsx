import React, { useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  showEmojiPicker?: boolean;
  onToggleEmojiPicker?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Digite uma mensagem...",
  disabled = false,
  showEmojiPicker = false,
  onToggleEmojiPicker,
  className = "",
  autoFocus = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize do textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  return (
    <div className={`flex items-end space-x-2 w-full ${className}`}>
      <div className="flex-1 relative min-w-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '36px', maxHeight: '100px' }}
        />
      </div>

      {onToggleEmojiPicker && (
        <button
          onClick={onToggleEmojiPicker}
          disabled={disabled}
          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Smile className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
