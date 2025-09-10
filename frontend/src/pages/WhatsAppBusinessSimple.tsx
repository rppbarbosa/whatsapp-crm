import React, { useState } from 'react';
import { ConversationList } from '../components/whatsapp/ConversationList';
import { ChatView } from '../components/whatsapp/ChatView';
import { useWhatsAppStateSimple } from '../hooks/useWhatsAppStateSimple';
import QRCodeDisplay from '../components/QRCodeDisplay';
import NewLeadModal from '../components/leads/NewLeadModal';
import { useLeads } from '../contexts/LeadContext';
import { Lead } from '../components/pipeline/LeadCard';
import { toast } from 'react-hot-toast';
import { extractCleanName, sanitizePhone } from '../utils/whatsappDataSanitizer';

const WhatsAppBusinessSimple: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedContactForLead, setSelectedContactForLead] = useState<any>(null);
  const { addLead } = useLeads();

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
    sendMedia,
    markChatAsRead,
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
    timestamp: new Date(msg.timestamp),
    type: (msg.type || 'text') as 'text' | 'image' | 'video' | 'audio' | 'document',
    status: 'delivered' as const,
    isFromMe: msg.isFromMe,
    mediaInfo: msg.mediaInfo, // Preservar informações de mídia
    mediaUrl: msg.mediaUrl,
    mediaName: msg.mediaName,
    mediaSize: msg.mediaSize
  }));

  const handleContactSelect = async (contact: any) => {
    setSelectedContact(contact);
    setShowChat(true);
    // Buscar conversa correspondente
    const chat = chats.find(c => c.id === contact.id);
    if (chat) {
      await selectChat(chat);
      
      // Marcar como lida se tinha mensagens não lidas
      if (contact.unreadCount > 0) {
        console.log(`📖 Marcando ${contact.unreadCount} mensagens como lidas para: ${contact.name}`);
        // Marcar mensagens como lidas usando a função do hook
        await markChatAsRead(contact.id);
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

  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => {
    if (selectedContact && selectedChat) {
      await sendMedia(file, type, message);
    }
  };

  const handleSync = () => {
    loadChats();
  };

  // Abrir modal de lead a partir do dropdown da lista de conversas
  const handleCreateLead = (contact: any) => {
    setSelectedContactForLead(contact);
    setShowLeadModal(true);
  };

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'tasks'>) => {
    try {
      addLead(leadData);
      toast.success(`Lead "${leadData.name}" criado com sucesso!`);
      setShowLeadModal(false);
      setSelectedContactForLead(null);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast.error('Erro ao criar lead');
    }
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
    <div className="h-full flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {!showChat ? (
        <div className="w-full">
          <ConversationList
            contacts={convertedContacts}
            selectedContact={selectedContact}
            onContactSelect={handleContactSelect}
            onNewChat={handleNewChat}
            loading={loading}
            syncing={loading}
            onSync={handleSync}
            onCreateLead={handleCreateLead}
          />
        </div>
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

      {/* Modal de criação de Lead (renderizado nesta página para evitar dependências) */}
      <NewLeadModal
        isOpen={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setSelectedContactForLead(null);
        }}
        onAdd={handleAddLead}
        prefillData={selectedContactForLead ? {
          name: extractCleanName(selectedContactForLead.name),
          phone: sanitizePhone(selectedContactForLead.phone),
          email: ''
        } : undefined}
      />
    </div>
  );
};

export default WhatsAppBusinessSimple;