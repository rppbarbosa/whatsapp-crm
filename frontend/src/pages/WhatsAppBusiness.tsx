import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { whatsappApi, WhatsAppInstance } from '../services/api';
import { toast } from 'react-hot-toast';

// Importar componentes do design system
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { MessageBubble } from '../components/whatsapp/MessageBubble';
import { ContactCard } from '../components/whatsapp/ContactCard';
import { 
  processContactsForDisplay, 
  sortContactsByRelevance, 
  generateInitials,
  isContactOnline,
  formatTimestamp,
  formatPhoneForWhatsApp,
  getPhoneInfo
} from '../utils/whatsappUtils';

interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  avatarUrl?: string; // URL da foto de perfil
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
  conversationId: string;
  instanceName: string;
  hasMessages: boolean;
  lastActivity?: string;
}

interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'sent' | 'delivered' | 'read';
}



interface NativeMessage {
  id: string;
  from_id: string;
  to_id: string;
  body: string;
  type: string;
  timestamp: number;
  is_from_me: boolean;
  media_url?: string;
  media_type?: string;
  media_filename?: string;
  status: string;
  instance_name: string;
  created_at: string;
  updated_at: string;
}

interface NativeConversation {
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  contact_status?: string;
  contact_is_business?: boolean;
  contact_is_verified?: boolean;
  last_message_body: string;
  last_message_timestamp: number;
  message_count: number;
  instance_name: string;
}

export default function WhatsAppBusiness() {
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | null>(null);

  // Utilitário: aguardar instância conectar
  const waitForConnected = useCallback(async (instanceName: string, timeoutMs = 20000, intervalMs = 1500): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const resp = await whatsappApi.getInstances();
        const list: WhatsAppInstance[] = resp.data?.data || [];
        const target = list.find((i) => i.instance_name === instanceName);
        if (target?.status === 'connected') {
          setInstances(list);
          return true;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  }, []);

  // Sincronizar dados do WhatsApp
  const syncWhatsAppData = async () => {
    if (!selectedInstance) return;

    try {
      setSyncing(true);

      // Verificar/aguardar conexão
      const ok = await waitForConnected(selectedInstance, 20000, 1500);
      if (!ok) {
        toast.error('Instância ainda não está conectada. Tente novamente em alguns segundos.');
        return;
      }

      // Sincronizar contatos
      await whatsappApi.syncContacts(selectedInstance);

      // Sincronizar mensagens (com retry se necessário)
      try {
        await whatsappApi.syncMessages(selectedInstance, 100);
      } catch (err: any) {
        if (err?.response?.data?.message?.toLowerCase?.().includes('not connected')) {
          const ok2 = await waitForConnected(selectedInstance, 15000, 1500);
          if (ok2) {
            await whatsappApi.syncMessages(selectedInstance, 100);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      toast.success('Dados sincronizados com sucesso!');
      await loadConversations();
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados do WhatsApp');
    } finally {
      setSyncing(false);
    }
  };

  // Carregar conversas usando API nativa
  const loadConversations = useCallback(async () => {
    if (!selectedInstance) return;
    
    try {
      setLoading(true);
      console.log(`📱 Carregando conversas da instância ${selectedInstance}...`);
      
      // Buscar conversas da API
      const response = await whatsappApi.getConversations(selectedInstance, false);
      const conversations: NativeConversation[] = response.data.data || [];
      
      console.log(`📨 ${conversations.length} conversas encontradas`);
      
      // Converter conversas para formato da interface usando utilitários
      const rawContacts: any[] = conversations.map(conv => ({
        id: conv.contact_id,
        phone: conv.contact_phone,
        name: conv.contact_name,
        display_name: conv.contact_name,
        profile_pic_url: conv.contact_avatar,
        status: conv.contact_status,
        is_business: conv.contact_is_business || false,
        is_verified: conv.contact_is_verified || false,
        has_messages: true,
        // Determinar se é grupo baseado no ID
        is_group: conv.contact_phone.includes('@g.us'),
        id_type: conv.contact_phone.includes('@g.us') ? 'group' : 'contact'
      }));
      
      // Processar contatos para exibição
      const processedContacts = processContactsForDisplay(rawContacts);
      const sortedContacts = sortContactsByRelevance(processedContacts);
      
      // Converter para formato da interface
      const contactsData: WhatsAppContact[] = sortedContacts.map(contact => ({
        id: contact.id,
        name: contact.displayName,
        phone: contact.originalData.phone, // Usar o número original, não o formatado
        avatar: generateInitials(contact.displayName),
        avatarUrl: contact.avatarUrl,
        lastMessage: conversations.find(c => c.contact_id === contact.id)?.last_message_body || 'Mensagem de mídia',
        timestamp: formatTimestamp(conversations.find(c => c.contact_id === contact.id)?.last_message_timestamp || 0),
        unreadCount: 0, // TODO: Implementar contagem de não lidas
        online: isContactOnline(contact.lastSeen),
        conversationId: contact.id,
        instanceName: selectedInstance,
        hasMessages: contact.hasMessages,
        lastActivity: contact.lastSeen
      }));
      
      console.log(`✅ ${contactsData.length} conversas ativas carregadas`);
      setContacts(contactsData);
      
      // Selecionar primeiro contato se não houver seleção
      if (contactsData.length > 0 && !selectedContact) {
        setSelectedContact(contactsData[0]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedInstance, selectedContact]);

  // Carregar instâncias apenas uma vez ao montar o componente
  useEffect(() => {
    const loadInstances = async () => {
      try {
        const response = await whatsappApi.getInstances();
        const instances: WhatsAppInstance[] = response.data?.data || [];
        setInstances(instances);
        
        // Selecionar primeira instância se não houver seleção
        if (instances.length > 0 && !selectedInstance) {
          setSelectedInstance(instances[0].instance_name);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar instâncias:', error);
        toast.error('Erro ao carregar instâncias');
      }
    };
    
    loadInstances();
  }, []); // Executar apenas uma vez ao montar

  // Carregar conversas quando a instância selecionada mudar
  useEffect(() => {
    if (selectedInstance) {
      loadConversations();
    }
  }, [selectedInstance, loadConversations]);

  // Auto-scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens usando API nativa
  const loadMessages = useCallback(async (contact: WhatsAppContact) => {
    if (!contact || !selectedInstance) return;

    try {
      setLoadingMessages(true);
      console.log(`💬 Carregando mensagens para ${contact.name} (${contact.phone})`);

      // Buscar mensagens da API
      const response = await whatsappApi.getConversationMessages(
        contact.conversationId, 
        selectedInstance, 
        50
      );
      
      // Corrigido: acessar response.data.data (array de mensagens)
      const nativeMessages: NativeMessage[] = response.data.data || [];

      console.log(`📨 ${nativeMessages.length} mensagens carregadas`);

      // Verificar se nativeMessages é um array válido
      if (!Array.isArray(nativeMessages)) {
        console.warn('⚠️ nativeMessages não é um array:', nativeMessages);
        setMessages([]);
        return;
      }

      // Converter para formato da interface
      const whatsappMessages: WhatsAppMessage[] = nativeMessages
        .sort((a, b) => a.timestamp - b.timestamp) // Ordenar por timestamp
        .map(msg => ({
          id: msg.id,
          text: msg.body || 'Mensagem de mídia',
          timestamp: new Date(msg.timestamp * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isFromMe: msg.is_from_me,
          status: msg.status as 'sent' | 'delivered' | 'read'
        }));

      setMessages(whatsappMessages);
      
      // Atualizar última mensagem do contato
      if (whatsappMessages.length > 0) {
        const lastMessage = whatsappMessages[whatsappMessages.length - 1];
        setContacts(prev => prev.map(c => 
          c.id === contact.id 
            ? { 
                ...c, 
                lastMessage: lastMessage.text,
                timestamp: lastMessage.timestamp
              }
            : c
        ));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedInstance]);

  // Assinar stream de eventos da conversa selecionada
  useEffect(() => {
    if (!selectedInstance || !selectedContact) return;
    const { whatsappStream, realtime } = require('../services/api');

    // 1) Tentar Supabase Realtime
    let unsubscribeRealtime = () => {};
    try {
      unsubscribeRealtime = realtime.subscribeMessages(
        selectedInstance,
        selectedContact.conversationId,
        (row: any) => {
          setMessages((prev) => [
            ...prev,
            {
              id: row.id,
              text: row.body || 'Mensagem',
              timestamp: new Date((row.timestamp || 0) * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              isFromMe: !!row.is_from_me,
              status: (row.status || 'sent') as 'sent' | 'delivered' | 'read',
            },
          ]);
        }
      );
    } catch {}

    // 2) Fallback SSE
    const unsubscribeSse = whatsappStream.subscribeConversation(
      selectedContact.conversationId,
      selectedInstance,
      (evt: any) => {
        if (!evt || evt.kind !== 'message') return;
        const isFromMe = !!evt.is_from_me;
        const ts = evt.timestamp ? new Date(evt.timestamp * 1000) : new Date();
        setMessages((prev) => [
          ...prev,
          {
            id: evt.id || `sse-${Date.now()}`,
            text: evt.body || 'Mensagem',
            timestamp: ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isFromMe,
            status: isFromMe ? 'sent' : 'delivered',
          },
        ]);
      }
    );

    return () => { try { unsubscribeRealtime(); } catch {}; try { unsubscribeSse(); } catch {} };
  }, [selectedInstance, selectedContact]);

  // Enviar mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !selectedInstance) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Evitar submit duplo durante envio
      if ((window as any)._sendingMessage) return;
      (window as any)._sendingMessage = true;

      console.log('🔍 Debug - Dados do contato selecionado:');
      console.log('  - ID:', selectedContact.id);
      console.log('  - Nome:', selectedContact.name);
      console.log('  - Telefone original:', selectedContact.phone);
      console.log('  - Instância:', selectedInstance);
      console.log('  - Mensagem:', messageContent);

      // Obter informações completas do número
      const phoneInfo = getPhoneInfo(selectedContact.phone);
      console.log('  - Informações do telefone:', phoneInfo);

      // Validar e formatar o número de telefone
      const phoneNumber = phoneInfo.formatted;
      console.log('  - Telefone formatado para WhatsApp:', phoneNumber);

      console.log(`📤 Enviando mensagem para ${phoneNumber} via ${selectedInstance}...`);

      // Enviar mensagem via WhatsApp
      const clientMessageId = `client-${Date.now()}`;
      const result = await whatsappApi.sendMessage(selectedInstance, {
        number: phoneNumber,
        text: messageContent,
        // @ts-ignore
        clientMessageId,
      } as any);

      console.log('✅ Mensagem enviada com sucesso:', result);

      // Adicionar mensagem localmente para feedback imediato
      const newMsg: WhatsAppMessage = {
        id: `temp-${Date.now()}`,
        text: messageContent,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isFromMe: true,
        status: 'sent'
      };

      setMessages(prev => [...prev, newMsg]);

      // Atualizar última mensagem do contato
      setContacts(prev => prev.map(c => 
        c.id === selectedContact.id 
          ? { 
              ...c, 
              lastMessage: messageContent,
              timestamp: newMsg.timestamp,
              lastActivity: new Date().toISOString()
            }
          : c
      ));

      toast.success('Mensagem enviada com sucesso!');
      
      // Recarregar mensagens após um breve delay para sincronizar
      setTimeout(() => {
        if (selectedContact) {
          loadMessages(selectedContact);
        }
      }, 600);

    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Restaurar a mensagem no input se houve erro
      setNewMessage(messageContent);
      
      // Tratamento específico de erros
      let errorMessage = 'Erro ao enviar mensagem';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Mostrar erro específico baseado no tipo
      if (errorMessage.includes('Invalid phone number')) {
        toast.error('Número de telefone inválido. Verifique o formato.');
      } else if (errorMessage.includes('not connected')) {
        toast.error('WhatsApp não está conectado. Tente novamente.');
      } else if (errorMessage.includes('Contact not found')) {
        toast.error('Contato não encontrado. Verifique o número.');
      } else if (errorMessage.includes('Client is not ready')) {
        toast.error('WhatsApp ainda não está pronto. Aguarde a conexão.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      (window as any)._sendingMessage = false;
    }
  };

  // Selecionar contato
  const handleContactSelect = (contact: WhatsAppContact) => {
    setSelectedContact(contact);
    loadMessages(contact);
  };

  // Filtrar contatos por busca
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm)
  );

  // Status da instância
  const getInstanceStatus = (status: string) => {
    switch (status) {
      case 'connected':
        return { color: 'text-green-500', icon: CheckCircleIcon, text: 'Conectado' };
      case 'connecting':
        return { color: 'text-yellow-500', icon: ExclamationCircleIcon, text: 'Conectando...' };
      case 'disconnected':
        return { color: 'text-red-500', icon: ExclamationCircleIcon, text: 'Desconectado' };
      default:
        return { color: 'text-gray-500', icon: ExclamationCircleIcon, text: 'Desconhecido' };
    }
  };

  // Verificar se há instâncias conectadas
      const hasConnectedInstances = instances.some(inst => inst.status === 'connected');

  if (loading && instances.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando instâncias do WhatsApp...</p>
        </div>
      </div>
    );
  }

  if (!hasConnectedInstances) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ExclamationCircleIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma instância ativa</h3>
          <p className="text-gray-600 mb-4">
            Não há instâncias do WhatsApp conectadas no momento. 
            Conecte uma instância para começar a usar o WhatsApp Business.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Lista de Contatos */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Conversas</h2>
              <p className="text-sm text-gray-500 mt-1">
                {contacts.length} conversa{contacts.length !== 1 ? 's' : ''} ativa{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={syncWhatsAppData}
                disabled={syncing}
                className="text-gray-600 hover:text-gray-900"
              >
                {syncing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 hover:text-gray-900"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Seletor de Instância */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instância WhatsApp
            </label>
            <select
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              {instances.map((inst) => {
                const status = getInstanceStatus(inst.status);
                return (
                  <option key={inst.instance_name} value={inst.instance_name}>
                    {inst.instance_name} {inst.phone_number && `(${inst.phone_number})`} - {status.text}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Busca */}
          <Input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            className="w-full"
          />
        </div>

        {/* Lista de Contatos */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhuma conversa ativa'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'Sincronize seus dados do WhatsApp para ver as conversas'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={syncWhatsAppData}
                  variant="outline"
                  size="sm"
                  disabled={syncing}
                >
                  {syncing ? 'Sincronizando...' : 'Sincronizar dados'}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  phone={contact.phone}
                  avatarUrl={contact.avatarUrl}
                  lastMessage={contact.lastMessage}
                  timestamp={new Date(contact.lastActivity || Date.now())}
                  unreadCount={contact.unreadCount}
                  isOnline={contact.online}
                  isSelected={selectedContact?.id === contact.id}
                  onClick={() => handleContactSelect(contact)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            {/* Header do Chat */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar
                    src={selectedContact.avatarUrl}
                    fallback={selectedContact.name}
                    size="lg"
                    status={selectedContact.online ? 'online' : 'offline'}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedContact.name}
                      </h3>
                      {selectedContact.online && (
                        <Badge variant="success" size="sm">
                          Online
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                      <PhoneIcon className="w-4 h-4" />
                      <span>{selectedContact.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <PhoneIcon className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhoneIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma mensagem encontrada
                  </h3>
                  <p className="text-gray-500">
                    Inicie uma conversa enviando uma mensagem
                  </p>
                </div>
              ) : (
                                  messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message.text}
                      timestamp={new Date()}
                      isFromMe={message.isFromMe}
                      status={message.status}
                      type="text"
                    />
                  ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  variant="primary"
                  size="icon"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PhoneIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Selecione uma conversa
              </h3>
              <p className="text-gray-600 mb-6">
                Escolha um contato da lista para iniciar uma conversa e começar a trocar mensagens
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Mensagens criptografadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span>Sincronização automática</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 