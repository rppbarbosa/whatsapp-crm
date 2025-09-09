import React from 'react';
import { MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';

interface Conversation {
  id: string;
  lastMessage: {
    body: string;
    timestamp: number;
    isFromMe: boolean;
    type: string;
  };
  unreadCount: number;
}

interface ConversationListOptimizedProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  loading: boolean;
}

export const ConversationListOptimized: React.FC<ConversationListOptimizedProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Menos de 1 minuto
      return 'Agora';
    } else if (diff < 3600000) { // Menos de 1 hora
      return `${Math.floor(diff / 60000)}min`;
    } else if (diff < 86400000) { // Menos de 1 dia
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
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
        return '💬';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
        <MessageCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">Nenhuma conversa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const phoneNumber = conversation.id.replace('@c.us', '');
        
        return (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-3 cursor-pointer transition-colors duration-200 ${
              isSelected
                ? 'bg-blue-50 border-r-2 border-blue-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {phoneNumber.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {phoneNumber}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </span>
                    {conversation.lastMessage.isFromMe && (
                      <div className="text-blue-500">
                        {conversation.lastMessage.type === 'text' ? (
                          <CheckCheck className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
                    <span className="text-xs text-gray-500">
                      {getMessageIcon(conversation.lastMessage.type)}
                    </span>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.body || 'Mensagem de mídia'}
                    </p>
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
