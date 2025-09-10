import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ChatView } from '../components/whatsapp/ChatView';
import { ConversationList, type WhatsAppContact } from '../components/whatsapp/ConversationList';
import NewLeadModal from '../components/leads/NewLeadModal';
import { Lead } from '../components/pipeline/LeadCard';
import { useLeads } from '../contexts/LeadContext';

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
  const { addLead } = useLeads();
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedContactForLead, setSelectedContactForLead] = useState<WhatsAppContact | null>(null);
  
  // Logs para rastrear mudanças de estado
  console.log('🔥 ESTADO ATUAL - showLeadModal:', showLeadModal);
  console.log('🔥 ESTADO ATUAL - selectedContactForLead:', selectedContactForLead);
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
            lastMessage: chat.lastMessage?.body,
            timestamp: chat.lastMessage?.timestamp * 1000,
            unreadCount: chat.unreadCount || 0,
            isOnline: false,
            isBusiness: false,
            isArchived: false,
            isPinned: false,
            isMuted: false,
            isBlocked: false,
            isFavorite: false
          }));

          setContacts(mappedContacts);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, API_KEY]);

  // Carregar mensagens
  const loadMessages = useCallback(async (contactId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats/${contactId}/messages?limit=50&loadHistory=true`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const mappedMessages: WhatsAppMessage[] = data.data.map((msg: any) => ({
            id: msg.id,
            text: msg.body,
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

          setMessages(mappedMessages);
          
          // Se for carga inicial, força scroll
          if (isInitialLoad.current) {
            setShouldAutoScroll(true);
            isInitialLoad.current = false;
          } 
          // Se recebemos novas mensagens e não estamos scrollando
          else if (mappedMessages.length > previousMessagesLength.current && !isUserScrolling) {
            setShouldAutoScroll(true);
          }
          previousMessagesLength.current = mappedMessages.length;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }, [API_BASE_URL, API_KEY, isUserScrolling]);

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

  // Selecionar contato
  const handleContactSelect = useCallback((contact: WhatsAppContact) => {
    setSelectedContact(contact);
    isInitialLoad.current = true; // Força scroll na primeira carga
    previousMessagesLength.current = 0; // Reset contador
    loadMessages(contact.id);
  }, [loadMessages]);

  // Carregar dados iniciais e configurar polling
  useEffect(() => {
    let statusInterval: NodeJS.Timeout;
    let chatsInterval: NodeJS.Timeout;
    let messagesInterval: NodeJS.Timeout;

    const loadInitialData = async () => {
      await loadStatus();
      if (status.isReady) {
        await loadContacts();
      }
    };

    loadInitialData();

    if (status.isReady) {
      // Status: a cada 2 minutos
      statusInterval = setInterval(() => {
        loadStatus();
      }, 120000);

      // Conversas: a cada 1 minuto
      chatsInterval = setInterval(() => {
        loadContacts();
      }, 60000);

      // REMOVIDO: Polling de mensagens duplicado - já existe no useWhatsAppStateSimple
      // O polling de mensagens é gerenciado pelo hook useWhatsAppStateSimple
    }

    return () => {
      clearInterval(statusInterval);
      clearInterval(chatsInterval);
      // messagesInterval removido - não é mais necessário
    };
  }, [status.isReady, loadStatus, loadContacts, loadMessages, selectedContact]);

  const handleCreateLead = (contact: WhatsAppContact) => {
    console.log('🔥 ===== INÍCIO handleCreateLead =====');
    console.log('🔥 FUNÇÃO CHAMADA - Criando lead para contato:', contact);
    console.log('🔥 showLeadModal ANTES:', showLeadModal);
    console.log('🔥 selectedContactForLead ANTES:', selectedContactForLead);
    
    console.log('🔥 EXECUTANDO setSelectedContactForLead...');
    setSelectedContactForLead(contact);
    
    console.log('🔥 EXECUTANDO setShowLeadModal(true)...');
    setShowLeadModal(true);
    
    console.log('🔥 showLeadModal DEPOIS:', true);
    console.log('🔥 ===== FIM handleCreateLead =====');
  };

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'tasks'>) => {
    try {
      addLead(leadData);
      toast.success(`Lead "${leadData.name}" criado com sucesso!`);
      setShowLeadModal(false);
      setSelectedContactForLead(null);
    } catch (error) {
      toast.error('Erro ao criar lead. Tente novamente.');
      console.error('Erro ao criar lead:', error);
    }
  };

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
  console.log('🔥 RENDERIZANDO MODAL - showLeadModal:', showLeadModal, 'selectedContactForLead:', selectedContactForLead);
  console.log('🔥 ===== RENDERIZANDO JSX MODAL =====');
  console.log('🔥 JSX - showLeadModal:', showLeadModal);
  console.log('🔥 JSX - selectedContactForLead:', selectedContactForLead);
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
              onCreateLead={handleCreateLead}
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

      {/* Modal de Criação de Lead */}
      <NewLeadModal
        isOpen={showLeadModal}
        onClose={() => {
          console.log('🔥 FECHANDO MODAL');
          setShowLeadModal(false);
          setSelectedContactForLead(null);
        }}
        onAdd={handleAddLead}
        prefillData={selectedContactForLead ? {
          name: selectedContactForLead.name,
          phone: selectedContactForLead.phone,
          email: ''
        } : undefined}
      />
      
      {/* Modal de Teste Simples - FORA do container com overflow */}
      {showLeadModal && (
        <div 
          className="fixed inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center z-[99999]"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">MODAL DE TESTE</h2>
            <p className="text-gray-700 mb-4">
              Se você está vendo isso, o problema não é de z-index!
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Contato: {selectedContactForLead?.name} - {selectedContactForLead?.phone}
            </p>
            <button
              onClick={() => {
                console.log('🔥 FECHANDO MODAL DE TESTE');
                setShowLeadModal(false);
                setSelectedContactForLead(null);
              }}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Fechar Modal de Teste
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;