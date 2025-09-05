import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  QrCode, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Play, 
  Square, 
  Send,
  MessageCircle,
  Users
} from 'lucide-react';
import QRCodeDisplay from '../components/QRCodeDisplay';

interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  isReady: boolean;
  qrCode?: string;
  phone?: string;
}

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  body: string;
  timestamp: number;
  from: string;
  to: string;
  isFromMe: boolean;
  type: string;
}

const WhatsAppSimple: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false
  });
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const API_KEY = process.env.REACT_APP_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

  // Carregar status do WhatsApp
  const loadStatus = async () => {
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
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Inicializar WhatsApp
  const initializeWhatsApp = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('WhatsApp inicializado!');
          await loadStatus();
        } else {
          toast.error('Erro ao inicializar WhatsApp');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      toast.error('Erro ao inicializar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Carregar conversas
  const loadChats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChats(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/chats/${chatId}/messages`, {
        headers: {
          'apikey': API_KEY
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setSendingMessage(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          to: selectedChat.id,
          message: newMessage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Mensagem enviada!');
          setNewMessage('');
          await loadMessages(selectedChat.id);
        } else {
          toast.error('Erro ao enviar mensagem');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  // Selecionar conversa
  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadStatus();
  }, []);

  // Atualizar status periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      loadStatus();
      if (status.isReady) {
        loadChats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status.isReady]);

  // Carregar conversas quando conectar
  useEffect(() => {
    if (status.isReady) {
      loadChats();
    }
  }, [status.isReady]);

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected': return 'text-green-600';
      case 'qr_ready': return 'text-yellow-600';
      case 'connecting': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected': return 'Conectado';
      case 'qr_ready': return 'Aguardando QR Code';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp CRM</h1>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${
                  status.isReady ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                {status.phone && (
                  <span className="text-sm text-gray-500">({status.phone})</span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {status.status === 'disconnected' && (
                <button
                  onClick={initializeWhatsApp}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>Conectar</span>
                </button>
              )}
              {status.status === 'qr_ready' && (
                <button
                  onClick={loadStatus}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Atualizar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code ou Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {status.status === 'qr_ready' && status.qrCode ? (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Escaneie o QR Code
                  </h3>
                  <QRCodeDisplay qrCode={status.qrCode} size={256} />
                  <p className="text-sm text-gray-600 mt-4">
                    Abra o WhatsApp no seu celular e escaneie este QR Code
                  </p>
                </div>
              ) : status.isReady ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    WhatsApp Conectado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Pronto para enviar e receber mensagens
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <WifiOff className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    WhatsApp Desconectado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Clique em "Conectar" para iniciar
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conversas e Mensagens */}
          <div className="lg:col-span-2">
            {status.isReady ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                {/* Lista de Conversas */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Conversas
                    </h3>
                  </div>
                  <div className="overflow-y-auto h-80">
                    {chats.length > 0 ? (
                      chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => selectChat(chat)}
                          className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {chat.name}
                              </h4>
                              {chat.lastMessage && (
                                <p className="text-sm text-gray-600 truncate">
                                  {chat.lastMessage.body}
                                </p>
                              )}
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Nenhuma conversa encontrada
                      </div>
                    )}
                  </div>
                </div>

                {/* Mensagens */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {selectedChat ? selectedChat.name : 'Mensagens'}
                    </h3>
                  </div>
                  <div className="h-64 overflow-y-auto p-4">
                    {selectedChat ? (
                      messages.length > 0 ? (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`mb-3 ${
                              message.isFromMe ? 'text-right' : 'text-left'
                            }`}
                          >
                            <div
                              className={`inline-block max-w-xs p-3 rounded-lg ${
                                message.isFromMe
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.body}</p>
                              <p className={`text-xs mt-1 ${
                                message.isFromMe ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.timestamp * 1000).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500">
                          Nenhuma mensagem encontrada
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-500">
                        Selecione uma conversa
                      </div>
                    )}
                  </div>
                  
                  {/* Input de mensagem */}
                  {selectedChat && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || sendingMessage}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Conecte o WhatsApp
                </h3>
                <p className="text-gray-600">
                  Conecte o WhatsApp para ver e enviar mensagens
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSimple;
