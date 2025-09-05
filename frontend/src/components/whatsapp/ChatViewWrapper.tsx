import React from 'react';
import { ChatView } from './ChatView';

interface ChatViewWrapperProps {
  contact: any;
  messages: any[];
  onSendMessage: (message: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => void;
  onBackToConversations: () => void;
  onContactUpdate?: (contactId: string, updates: any) => void;
  className?: string;
}

export const ChatViewWrapper: React.FC<ChatViewWrapperProps> = ({
  contact,
  messages,
  onSendMessage,
  onSendMedia,
  onBackToConversations,
  onContactUpdate,
  className = ''
}) => {
  // Converter dados para o formato esperado pelo ChatView
  const convertContactForChatView = (contact: any) => {
    return {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      avatarUrl: contact.avatarUrl,
      isOnline: contact.online,
      isGroup: contact.isGroup,
      isBusiness: contact.isBusiness || false,
      isFavorite: contact.isFavorite || false,
      isBookmarked: contact.isBookmarked || false,
      isArchived: contact.isArchived || false,
      unreadCount: contact.unreadCount,
      lastMessage: contact.lastMessage,
      memberCount: contact.memberCount,
      timestamp: new Date(contact.lastActivity || Date.now()).getTime()
    };
  };

  const convertMessagesForChatView = (messages: any[]) => {
    return messages.map(message => ({
      id: message.id,
      text: message.text,
      timestamp: new Date(),
      type: 'text' as const,
      mediaUrl: undefined,
      mediaName: undefined,
      mediaSize: undefined,
      mediaDuration: undefined,
      status: message.status,
      isFromMe: message.isFromMe
    }));
  };

  const convertedContact = convertContactForChatView(contact);
  const convertedMessages = convertMessagesForChatView(messages);

  return (
    <div className={`flex-1 relative z-30 h-full ${className}`}>
      <ChatView
        contact={convertedContact}
        messages={convertedMessages}
        loading={false}
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        onBackToConversations={onBackToConversations}
        onContactUpdate={onContactUpdate}
      />
    </div>
  );
};
