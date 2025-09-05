import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { whatsappApi } from '../services/api';
import { 
  MOCK_CONTACTS, 
  MOCK_MESSAGES, 
  generateRandomMessages,
  type WhatsAppContact,
  type WhatsAppMessage
} from '../data/mockWhatsAppData';

export const useWhatsAppState = () => {
  const [contacts, setContacts] = useState<WhatsAppContact[]>(MOCK_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [instanceConnected, setInstanceConnected] = useState(false);

  // Sincronizar dados reais do WhatsApp
  const syncWhatsAppData = useCallback(async () => {
    setSyncing(true);
    
    try {
      console.log('🔄 Sincronizando dados do WhatsApp...');
      
      // Verificar se a instância está conectada
      const instanceStatus = await whatsappApi.getInstanceStatus();
      
      if (!instanceStatus.data.success || !instanceStatus.data.instance) {
        throw new Error('Instância não está conectada');
      }
      
      if (instanceStatus.data.instance.status !== 'connected') {
        throw new Error('Instância não está conectada. Status: ' + instanceStatus.data.instance.status);
      }
      
      // Buscar conversas reais
      const chatsResponse = await whatsappApi.getContacts();
      
      if (chatsResponse.data.success && chatsResponse.data.data) {
        // Converter dados do WhatsApp para o formato do frontend
        const realContacts: WhatsAppContact[] = chatsResponse.data.data.map((chat: any) => ({
          id: chat.id,
          name: chat.name || 'Contato sem nome',
          phone: chat.id.includes('@') ? chat.id.split('@')[0] : chat.id,
          avatarUrl: undefined,
          isOnline: false,
          isGroup: chat.isGroup || false,
          isBusiness: false,
          isFavorite: false,
          isBookmarked: false,
          isArchived: false,
          unreadCount: chat.unreadCount || 0,
          lastMessage: chat.lastMessage?.body || '',
          memberCount: chat.isGroup ? 0 : undefined,
          timestamp: chat.timestamp || Date.now(),
          conversationId: chat.id,
          instanceName: 'whatsapp-crm-instance',
          hasMessages: true,
          lastActivity: new Date(chat.timestamp || Date.now()).toISOString()
        }));
        
        setContacts(realContacts);
        console.log(`✅ ${realContacts.length} conversas sincronizadas`);
        toast.success(`${realContacts.length} conversas sincronizadas com sucesso!`);
      } else {
        console.log('⚠️ Nenhuma conversa encontrada');
        toast('Nenhuma conversa encontrada', { icon: 'ℹ️' });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao sincronizar dados:', error);
      toast.error(`Erro ao sincronizar: ${error.message}`);
      
      // Manter dados mockados em caso de erro
      console.log('🔄 Mantendo dados mockados devido ao erro');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Verificar status da instância periodicamente
  useEffect(() => {
    const checkInstanceStatus = async () => {
      try {
        const instanceStatus = await whatsappApi.getInstanceStatus();
        const isConnected = instanceStatus.data.success && 
                           instanceStatus.data.instance && 
                           instanceStatus.data.instance.status === 'connected';
        
        setInstanceConnected(isConnected);
        
        // Se a instância estiver conectada e não tivermos dados reais, sincronizar
        if (isConnected && contacts === MOCK_CONTACTS) {
          console.log('🔄 Instância conectada, sincronizando dados...');
          await syncWhatsAppData();
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status da instância:', error);
        setInstanceConnected(false);
      }
    };

    // Verificar imediatamente
    checkInstanceStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkInstanceStatus, 30000);

    return () => clearInterval(interval);
  }, [contacts, syncWhatsAppData]);

  // Selecionar contato e carregar mensagens reais
  const handleContactSelect = useCallback(async (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    setShowChat(true);
    setMessages([]); // Limpar mensagens anteriores
    
    try {
      console.log(`📱 Carregando mensagens para: ${contact.name} (${contact.id})`);
      
      // Carregar mensagens reais do WhatsApp
      const messagesResponse = await whatsappApi.getConversationMessages(contact.id, 50);
      
      if (Array.isArray(messagesResponse.data) && messagesResponse.data.length > 0) {
        // Converter mensagens do WhatsApp para o formato do frontend
        const realMessages: WhatsAppMessage[] = messagesResponse.data.map((msg: any) => ({
          id: msg.id._serialized || msg.id,
          text: msg.body || msg.text || '',
          timestamp: new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          type: msg.type || 'text',
          mediaUrl: msg.hasMedia ? undefined : undefined, // TODO: Implementar URLs de mídia
          mediaName: undefined,
          mediaSize: undefined,
          mediaDuration: undefined,
          status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : 'sent',
          isFromMe: msg.fromMe || false
        }));
        
        setMessages(realMessages);
        console.log(`✅ ${realMessages.length} mensagens carregadas`);
      } else {
        console.log('⚠️ Nenhuma mensagem encontrada para este contato');
        setMessages([]);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar mensagens:', error);
      toast.error(`Erro ao carregar mensagens: ${error.message}`);
      
      // Fallback para mensagens mockadas em caso de erro
      if (contact.id === '1') {
        setMessages(MOCK_MESSAGES);
      } else {
        const randomMessages = generateRandomMessages(contact.id);
        setMessages(randomMessages);
      }
    }
  }, []);

  // Voltar para a lista de conversas
  const handleBackToList = useCallback(() => {
    setShowChat(false);
    setSelectedContact(null);
    setMessages([]);
  }, []);

  // Enviar mensagem real via WhatsApp
  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !selectedContact) return false;

    // Adicionar mensagem localmente primeiro (para feedback imediato)
    const newMsg: WhatsAppMessage = {
      id: `temp-${Date.now()}`,
      text: messageContent.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isFromMe: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, newMsg]);

    try {
      console.log(`📤 Enviando mensagem para ${selectedContact.name}: ${messageContent}`);
      
      // Enviar mensagem via API real
      const sendResponse = await whatsappApi.sendMessage({
        number: selectedContact.phone,
        text: messageContent.trim()
      });

      if (sendResponse.data.success) {
        // Atualizar status da mensagem para enviada
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'sent' } : msg
        ));

        // Atualizar última mensagem do contato
        setContacts(prev => prev.map(c => 
          c.id === selectedContact.id 
            ? { 
                ...c, 
                lastMessage: messageContent.trim(),
                timestamp: newMsg.timestamp,
                lastActivity: new Date().toISOString()
              }
            : c
        ));

        toast.success('Mensagem enviada com sucesso!');
        console.log('✅ Mensagem enviada com sucesso');
        return true;
      } else {
        throw new Error(sendResponse.data.message || 'Erro ao enviar mensagem');
      }

    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Atualizar status da mensagem para erro
      setMessages(prev => prev.map(msg => 
        msg.id === newMsg.id ? { ...msg, status: 'error' } : msg
      ));
      
      toast.error(`Erro ao enviar mensagem: ${error.message}`);
      return false;
    }
  }, [selectedContact]);

  // Filtrar contatos por busca
  const filterContacts = useCallback((searchTerm: string) => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
    );
  }, [contacts]);

  // Marcar mensagem como lida
  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'read' as const } : msg
    ));
  }, []);

  // Marcar mensagem como entregue
  const markMessageAsDelivered = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'delivered' as const } : msg
    ));
  }, []);

  // Limpar mensagens não lidas
  const clearUnreadCount = useCallback((contactId: string) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
    ));
  }, []);

  // Adicionar novo contato (para demonstração)
  const addNewContact = useCallback((contact: Omit<WhatsAppContact, 'id'>) => {
    const newContact: WhatsAppContact = {
      ...contact,
      id: `new_${Date.now()}`,
      conversationId: `conv_new_${Date.now()}`,
      instanceName: 'whatsapp-crm-instance',
      hasMessages: false,
      lastActivity: new Date().toISOString()
    };
    
    setContacts(prev => [newContact, ...prev]);
    toast.success('Novo contato adicionado!');
  }, []);

  // Remover contato
  const removeContact = useCallback((contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    
    if (selectedContact?.id === contactId) {
      handleBackToList();
    }
    
    toast.success('Contato removido!');
  }, [selectedContact, handleBackToList]);

  // Atualizar contato (para funcionalidades como arquivar, fixar, etc.)
  const updateContact = useCallback((contactId: string, updates: Partial<WhatsAppContact>) => {
    setContacts(prev => prev.map(contact => 
      contact.id === contactId ? { ...contact, ...updates } : contact
    ));
  }, []);

  return {
    // Estado
    contacts,
    selectedContact,
    messages,
    showChat,
    syncing,
    instanceConnected,
    
    // Ações
    syncWhatsAppData,
    handleContactSelect,
    handleBackToList,
    handleSendMessage,
    filterContacts,
    markMessageAsRead,
    markMessageAsDelivered,
    clearUnreadCount,
    addNewContact,
    removeContact,
    updateContact,
    
    // Setters
    setContacts,
    setSelectedContact,
    setMessages,
    setShowChat,
    setSyncing
  };
};
