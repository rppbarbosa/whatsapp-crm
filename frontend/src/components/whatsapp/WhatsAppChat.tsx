import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, 
  Phone, 
  MessageCircle, 
  Search, 
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Smile,
  X
} from 'lucide-react';
import { whatsappApi } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Message {
  id: number;
  message_id: string;
  from_number: string;
  to_number: string;
  message_content: string;
  message_type: string;
  timestamp: string;
  is_from_me: boolean;
  status: string;
}

interface Conversation {
  conversationId: string;
  lastMessage: string;
  lastTimestamp: string;
  contactNumber: string;
  unreadCount: number;
}

interface WhatsAppChatProps {
  instanceName: string;
  onClose: () => void;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ instanceName, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Scroll para o final das mensagens
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Carregar conversas da instância
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.get(`/api/whatsapp/instance/conversations`);
      
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, [instanceName]);

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await whatsappApi.get(`/api/whatsapp/instance/conversations/${conversationId}/messages`);
      
      if (response.data.success) {
        setMessages(response.data.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [instanceName, scrollToBottom]);

  // Enviar mensagem
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Extrair número do telefone da conversa selecionada
      const conversation = conversations.find(c => c.conversationId === selectedConversation);
      if (!conversation) return;

      const toNumber = conversation.contactNumber;

      const response = await whatsappApi.post(`/api/whatsapp/instance/send-message`, {
        to: toNumber,
        message: newMessage
      });

      if (response.data.success) {
        setNewMessage('');
        // Recarregar mensagens para mostrar a nova mensagem
        await loadMessages(selectedConversation);
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    }
  }, [newMessage, selectedConversation, conversations, instanceName, loadMessages]);

  // Iniciar nova conversa
  const startNewConversation = useCallback(async () => {
    if (!phoneNumber.trim()) return;

    try {
      // Criar ID de conversa temporário
      const tempConversationId = `${instanceName}_${phoneNumber}_me`;
      
      // Adicionar conversa temporária
      const tempConversation: Conversation = {
        conversationId: tempConversationId,
        lastMessage: '',
        lastTimestamp: new Date().toISOString(),
        contactNumber: phoneNumber,
        unreadCount: 0
      };

      setConversations(prev => [tempConversation, ...prev]);
      setSelectedConversation(tempConversationId);
      setPhoneNumber('');
    } catch (error) {
      console.error('❌ Erro ao iniciar nova conversa:', error);
    }
  }, [phoneNumber, instanceName]);

  // Formatar timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
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
  }, []);

  // Filtrar conversas por busca
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv =>
      conv.contactNumber.includes(searchTerm) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  // Carregar conversas na inicialização
  useEffect(() => {
    if (instanceName) {
      loadConversations();
    }
  }, [instanceName, loadConversations]);

  // Scroll automático para novas mensagens
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar com conversas */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Conversas</h3>
              <p className="text-sm text-gray-500">Instância: {instanceName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Nova conversa */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Número do telefone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={startNewConversation}
              disabled={!phoneNumber.trim()}
              size="sm"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando conversas...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.conversationId ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conversation.conversationId);
                  loadMessages(conversation.conversationId);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {conversation.contactNumber.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {conversation.contactNumber}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage || 'Nenhuma mensagem'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {formatTimestamp(conversation.lastTimestamp)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <div className="mt-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {conversation.unreadCount}
                        </span>
        </div>
      )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header do chat */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {conversations.find(c => c.conversationId === selectedConversation)?.contactNumber.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {conversations.find(c => c.conversationId === selectedConversation)?.contactNumber}
                    </h4>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">
                  Carregando mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.is_from_me
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message_content}</p>
                      <p className={`text-xs mt-1 ${
                        message.is_from_me ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                        {message.is_from_me && (
                          <span className="ml-2">
                            {message.status === 'delivered' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>
                <Input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Estado vazio */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa da lista para começar a conversar
              </p>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default WhatsAppChat;