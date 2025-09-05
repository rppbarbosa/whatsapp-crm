import React, { useState } from 'react';
import { WhatsAppLayout } from '../components/whatsapp/WhatsAppLayout';
import { ConversationList } from '../components/whatsapp/ConversationList';
import { ChatView } from '../components/whatsapp/ChatView';
import { useWhatsAppStateSimple } from '../hooks/useWhatsAppStateSimple';
import { whatsappApi } from '../services/apiSimple';
import QRCodeDisplay from '../components/QRCodeDisplay';

const WhatsAppBusinessSimple: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  const {
    status,
    chats,
    selectedChat,
    messages,
    loading,
    loadingHistory,
    hasMoreHistory,
    totalMessages,
    isUserScrolling,
    shouldAutoScroll,
    initializeWhatsApp,
    sendMessage,
    selectChat,
    loadChats,
    loadEarlierMessages,
    setIsUserScrolling,
    setShouldAutoScroll
  } = useWhatsAppStateSimple();

  // Converter dados do backend para o formato dos componentes
  const convertedContacts = chats.map(chat => ({
    id: chat.id,
    name: chat.name || 'Sem nome',
    phone: chat.id,
    isGroup: chat.isGroup || false,
    unreadCount: chat.unreadCount || 0,
    lastMessage: chat.lastMessage?.body || '',
    timestamp: chat.lastMessage?.timestamp || Date.now(),
    isOnline: false,
    isBusiness: false,
    isFavorite: false,
    isBookmarked: false,
    isPinned: false,
    isMuted: false,
    isArchived: false,
    isBlocked: false,
    memberCount: chat.isGroup ? 10 : undefined
  }));

  const convertedMessages = messages.map(msg => ({
    id: msg.id,
    text: msg.body || '',
    timestamp: new Date(msg.timestamp * 1000),
    type: 'text' as const,
    status: 'delivered' as const,
    isFromMe: msg.isFromMe
  }));

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact);
    setShowChat(true);
    // Buscar conversa correspondente
    const chat = chats.find(c => c.id === contact.id);
    if (chat) {
      selectChat(chat);
      
      // Marcar como lida se tinha mensagens não lidas
      if (contact.unreadCount > 0) {
        console.log(`📖 Marcando ${contact.unreadCount} mensagens como lidas para: ${contact.name}`);
        // Marcar mensagens como lidas no backend
        whatsappApi.markChatAsRead(contact.id).catch(error => {
          console.error('Erro ao marcar como lida:', error);
        });
      }
    }
  };

  const handleBackToConversations = () => {
    setShowChat(false);
    setSelectedContact(null);
  };

  const handleNewChat = () => {
    console.log('Nova conversa solicitada');
  };

  const handleSendMessage = (message: string) => {
    if (selectedContact && selectedChat) {
      sendMessage(message);
    }
  };

  const handleSendMedia = (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => {
    console.log('Enviar mídia:', file, type, message);
  };

  const handleSync = () => {
    loadChats();
  };

  // Calcular total de mensagens não lidas
  const totalUnreadCount = convertedContacts.reduce((total, contact) => {
    return total + (contact.unreadCount || 0);
  }, 0);

  // Atualizar título da página com contador não lidas
  React.useEffect(() => {
    if (totalUnreadCount > 0) {
      document.title = `(${totalUnreadCount}) WhatsApp Business CRM`;
    } else {
      document.title = 'WhatsApp Business CRM';
    }
  }, [totalUnreadCount]);

  // Se não está conectado, mostrar QR Code
  if (status.status !== 'connected' && status.status !== 'qr_ready') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Business</h1>
          <button
            onClick={initializeWhatsApp}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Conectar WhatsApp'}
          </button>
        </div>
      </div>
    );
  }

  // Se QR Code está pronto
  if (status.status === 'qr_ready' && status.qrCode) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Business</h1>
          <p className="text-gray-600 mb-6">Escaneie o QR Code com seu WhatsApp</p>
          <QRCodeDisplay qrCode={status.qrCode} size={300} />
        </div>
      </div>
    );
  }

  return (
    <WhatsAppLayout
      instance={{
        userInfo: {
          name: 'WhatsApp Business',
          phone: '+55 11 99999-9999'
        }
      }}
      onNewChat={handleNewChat}
      showChat={showChat}
      onBackToConversations={handleBackToConversations}
    >
      {!showChat ? (
        <ConversationList
          contacts={convertedContacts}
          selectedContact={selectedContact}
          onContactSelect={handleContactSelect}
          onNewChat={handleNewChat}
          loading={loading}
          syncing={loading}
          onSync={handleSync}
        />
      ) : (
        selectedContact && (
          <ChatView
            contact={selectedContact}
            messages={convertedMessages}
            loading={loading}
            loadingHistory={loadingHistory}
            hasMoreHistory={hasMoreHistory}
            totalMessages={totalMessages}
            isUserScrolling={isUserScrolling}
            shouldAutoScroll={shouldAutoScroll}
            onSendMessage={handleSendMessage}
            onSendMedia={handleSendMedia}
            onBackToConversations={handleBackToConversations}
            onLoadEarlierMessages={loadEarlierMessages}
            onUserScrollChange={setIsUserScrolling}
            onAutoScrollChange={setShouldAutoScroll}
          />
        )
      )}
    </WhatsAppLayout>
  );
};

export default WhatsAppBusinessSimple;