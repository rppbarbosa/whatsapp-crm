import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ChatView } from '../components/whatsapp/ChatView';
import { ConversationList, type WhatsAppContact } from '../components/whatsapp/ConversationList';

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error' | 'initializing';
  isReady: boolean;
  qrCode?: string;
  phone?: string;
}

interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  isFromMe: boolean;
  from: string;
  to: string;
}

const WhatsApp: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false
  });
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_KEY = process.env.REACT_APP_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

  // Ref para controle de requisições e scroll
  const lastRequestTime = useRef<number>(0);
  const minRequestInterval = 2000; // 2 segundos entre requisições
  const previousMessagesLength = useRef<number>(0);
  const isInitialLoad = useRef<boolean>(true);


  // Carregar status do WhatsApp
  const loadStatus = useCallback(async () => {
    const now = Date.now();
    if (now - lastRequestTime.current < minRequestInterval) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatus(data.data);
          lastRequestTime.current = now;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  }, [API_BASE_URL, API_KEY]);

  // Carregar contatos
  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const mappedContacts: WhatsAppContact[] = data.data.map((chat: any) => ({
            id: chat.id,
            name: chat.name || chat.id,
            phone: chat.phone || chat.id,
            isGroup: chat.isGroup || false,
            lastMessage: chat.lastMessage?.body || '',
            timestamp: chat.lastMessage?.timestamp ? chat.lastMessage.timestamp * 1000 : Date.now(),
            unreadCount: chat.unreadCount || 0,
            isOnline: false,
            isBusiness: false,
            isArchived: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false,
            isFavorite: false
          }));

          // Preservar última mensagem existente se não houver nova no backend
          setContacts(prevContacts => {
            return mappedContacts.map(newContact => {
              const existingContact = prevContacts.find(c => c.id === newContact.id);
              if (existingContact && !newContact.lastMessage && existingContact.lastMessage) {
                // Se não há nova mensagem no backend, manter a existente
                return {
                  ...newContact,
                  lastMessage: existingContact.lastMessage,
                  timestamp: existingContact.timestamp
                };
              }
              return newContact;
            });
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, API_KEY]);

  // Carregar mensagens com loading state e retry
  const loadMessages = useCallback(async (contactId: string) => {
    if (!contactId) return;
    
    setLoading(true);
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadWithRetry = async (): Promise<WhatsAppMessage[]> => {
      try {
        console.log(`📱 Tentativa ${retryCount + 1} de carregar mensagens para: ${contactId}`);
        
        const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats/${contactId}/messages?limit=50&loadHistory=true`, {
          headers: { 'apikey': API_KEY }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error || 'Erro ao carregar mensagens');
        
        return data.data.map((msg: any) => ({
          id: msg.id,
          text: msg.body || '',
          timestamp: new Date(msg.timestamp * 1000),
          type: msg.type || 'text',
          mediaUrl: msg.mediaUrl,
          mediaName: msg.mediaName,
          mediaSize: msg.mediaSize,
          mediaDuration: msg.mediaDuration,
          status: msg.status || 'sent',
          isFromMe: msg.isFromMe,
          from: msg.from,
          to: msg.to
        }));
      } catch (error) {
        console.error(`❌ Erro na tentativa ${retryCount + 1}:`, error);
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          return loadWithRetry();
        }
        throw error;
      }
    };

    try {
      // ETAPA 1: Carregar mensagens iniciais rapidamente
      const messages = await loadWithRetry();
      console.log(`📨 Carregadas ${messages.length} mensagens`);
      
      // ETAPA 2: Atualizar estado com loading
      setMessages(messages);
      if (isInitialLoad.current) {
        setShouldAutoScroll(true);
        isInitialLoad.current = false;
      }
      previousMessagesLength.current = messages.length;
      
      // ETAPA 3: Carregar mais mensagens em background se necessário
      if (messages.length === 50) {
        setTimeout(async () => {
          try {
            const moreMessages = await loadWithRetry();
            if (moreMessages.length > messages.length) {
              console.log(`📨 Carregadas mais ${moreMessages.length - messages.length} mensagens`);
              setMessages(moreMessages);
            }
          } catch (error) {
            console.error('❌ Erro ao carregar mais mensagens:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, API_KEY]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !selectedContact) return;

    try {
      console.log('📤 Enviando mensagem:', { message, contactId: selectedContact.id });
      setSendingMessage(true);
      
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          to: selectedContact.id,
          message: message
        })
      });
      
      console.log('📡 Resposta do servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📨 Dados da resposta:', data);
        
        if (data.success) {
          console.log('✅ Mensagem enviada com sucesso');
          toast.success('Mensagem enviada!');
          // Após enviar, carrega as mensagens com scroll suave
          await loadMessages(selectedContact.id);
          setShouldAutoScroll(true);
        } else {
          console.error('❌ Erro na resposta:', data.error);
          toast.error(`Erro ao enviar mensagem: ${data.error}`);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erro HTTP:', response.status, errorData);
        toast.error(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  }, [API_BASE_URL, API_KEY, selectedContact, loadMessages]);

  // Enviar mídia
  const handleSendMedia = useCallback(async (file: File, type: 'image' | 'video' | 'audio' | 'document', message?: string) => {
    if (!selectedContact) return;

    try {
      setSendingMessage(true);
      // TODO: Implementar envio de mídia
      console.log('Enviando mídia:', { file, type, message });
      toast.error('Envio de mídia ainda não implementado');
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
      toast.error('Erro ao enviar mídia');
    } finally {
      setSendingMessage(false);
    }
  }, [selectedContact]);

  // Atualizar contato
  const handleContactUpdate = useCallback((contactId: string, updates: Partial<WhatsAppContact>) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === contactId 
          ? { ...contact, ...updates }
          : contact
      )
    );
  }, []);

  // Apagar contato
  const handleContactDelete = useCallback((contactId: string) => {
    setContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactId));
    if (selectedContact?.id === contactId) {
      setSelectedContact(null);
    }
  }, [selectedContact]);

  // Voltar para lista de conversas (mobile)
  const handleBackToConversations = useCallback(() => {
    setSelectedContact(null);
    isInitialLoad.current = true; // Reset para próxima conversa
  }, []);

  // Marcar mensagens como lidas
  const markAsRead = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats/${chatId}/mark-read`, {
        method: 'POST',
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Atualizar apenas o contador, preservando a última mensagem
          setContacts(prevContacts => 
            prevContacts.map(contact => 
              contact.id === chatId 
                ? { ...contact, unreadCount: 0 } // Apenas zera o contador, mantém lastMessage
                : contact
            )
          );
          console.log(`📖 Mensagens marcadas como lidas para ${chatId.substring(0, 20)}...`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  }, [API_BASE_URL, API_KEY]);

  // Selecionar contato
  const handleContactSelect = useCallback((contact: WhatsAppContact) => {
    console.log(`👤 Selecionando contato: ${contact.name} (${contact.id})`);
    setSelectedContact(contact);
    setShouldAutoScroll(true); // Sempre ativa scroll ao abrir nova conversa
    isInitialLoad.current = true; // Força scroll na primeira carga
    // Reset estado de scroll será gerenciado pelo ChatView
    previousMessagesLength.current = 0; // Reset contador
    
    // Marcar mensagens como lidas quando abrir o chat
    if (contact.unreadCount && contact.unreadCount > 0) {
      markAsRead(contact.id);
    }
    
    // Carregar mensagens imediatamente
    loadMessages(contact.id);
    
    // Recarregar conversas para atualizar contadores
    setTimeout(() => {
      loadContacts();
    }, 1000);
  }, [loadMessages, markAsRead, loadContacts]);

  // Carregar dados iniciais e configurar polling de status/contatos
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let chatsInterval: NodeJS.Timeout;

    const loadInitialData = async () => {
      await loadStatus();
      if (status.isReady) {
        await loadContacts();
      }
    };

    loadInitialData();

    if (status.isReady) {
      // Status: a cada 5 minutos (WPPConnect gerencia internamente)
      statusInterval = setInterval(() => {
        loadStatus();
      }, 300000);

      // Conversas: a cada 30 segundos para detectar mensagens não lidas
      chatsInterval = setInterval(() => {
        loadContacts();
      }, 30000);
    }

    return () => {
      clearInterval(statusInterval);
      clearInterval(chatsInterval);
    };
  }, [status.isReady, loadStatus, loadContacts]);

  // Carregar mensagens iniciais ao selecionar contato
  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
    }
  }, [selectedContact, loadMessages]);

  // Renderizar estado de não conectado
  if (!status.isReady) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            WhatsApp não conectado
          </h3>
          <p className="text-gray-500 mb-4">
            Acesse "Gerenciar Instâncias" para conectar o WhatsApp
          </p>
        </div>
      </div>
    );
  }

  // Renderizar layout principal
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex relative">
        {/* Lista de Conversas - Sempre visível quando não há chat selecionado */}
        {!selectedContact && (
          <div className="w-full bg-white flex-shrink-0">
            <ConversationList
              contacts={contacts}
              selectedContact={selectedContact}
              onContactSelect={handleContactSelect}
              onNewChat={() => {}}
              loading={loading}
              syncing={syncing}
              onSync={() => loadContacts()}
              onContactUpdate={handleContactUpdate}
              onContactDelete={handleContactDelete}
            />
          </div>
        )}

        {/* Chat - Visível apenas quando há chat selecionado */}
        {selectedContact && (
          <div className="w-full bg-white flex-1 flex flex-col">
            <ChatView
              contact={selectedContact}
              messages={messages}
              onSendMessage={sendMessage}
              onSendMedia={handleSendMedia}
              onBackToConversations={handleBackToConversations}
              loading={sendingMessage}
              loadingHistory={false}
              hasMoreHistory={false}
              totalMessages={messages.length}
              isUserScrolling={isUserScrolling}
              shouldAutoScroll={shouldAutoScroll}
              onUserScrollChange={setIsUserScrolling}
              onAutoScrollChange={setShouldAutoScroll}
              onContactUpdate={handleContactUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsApp;