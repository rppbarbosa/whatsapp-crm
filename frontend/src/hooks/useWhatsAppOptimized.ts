import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  body: string;
  text: string; // Adicionar para compatibilidade
  timestamp: number;
  from: string;
  to: string;
  isFromMe: boolean;
  type: string;
  status?: string; // Adicionar para compatibilidade
  mediaInfo?: {
    type: string;
    url: string;
    filename: string;
    hasMedia: boolean;
    mimetype?: string;
    size?: number;
  };
}

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

interface WhatsAppStatus {
  status: 'connected' | 'disconnected' | 'connecting';
  isReady: boolean;
}

export const useWhatsAppOptimized = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Conectar WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `${window.location.protocol === 'https' ? 'wss' : 'ws'}://${window.location.host}/ws?userId=user-${Date.now()}`;
    console.log('🔌 Conectando WebSocket:', wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setWsConnected(true);
        reconnectAttempts.current = 0;
        
        // Entrar na sala de status geral
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'join_room',
            roomId: 'whatsapp-status'
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        setWsConnected(false);
        scheduleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        setWsConnected(false);
      };

    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      scheduleReconnect();
    }
  }, []);

  // Agendar reconexão
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    console.log(`🔄 Reconectando em ${delay}ms (tentativa ${reconnectAttempts.current + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectWebSocket();
    }, delay);
  }, [connectWebSocket]);

  // Processar mensagens do WebSocket
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'connection_established':
        console.log('✅ Conexão WebSocket estabelecida');
        break;

      case 'new_message':
        console.log('📨 Nova mensagem recebida via WebSocket:', data.message);
        
        // Adicionar mensagem à lista se for da conversa ativa
        if (selectedConversation && data.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, data.message]);
        }
        
        // Atualizar conversas
        loadConversations();
        
        // Notificar usuário
        if (!data.message.isFromMe) {
          toast.success(`📨 Nova mensagem de ${data.conversationId}`, {
            duration: 2000,
            icon: '📨'
          });
        }
        break;

      case 'whatsapp_status':
        console.log('📱 Status do WhatsApp atualizado:', data.status);
        setStatus(prev => ({
          ...prev,
          status: data.status,
          isReady: data.status === 'connected'
        }));
        break;

      case 'pong':
        console.log('🏓 Pong recebido');
        break;

      default:
        console.log('📨 Mensagem WebSocket desconhecida:', data.type);
    }
  }, [selectedConversation]);

  // Carregar conversas do Supabase
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/whatsapp-optimized/conversations?limit=100', {
        headers: {
          'apikey': process.env.REACT_APP_EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data);
        console.log(`💬 ${data.data.length} conversas carregadas`);
      } else {
        console.error('❌ Erro ao carregar conversas:', data.error);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (conversationId: string, limit = 50, offset = 0) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/whatsapp-optimized/messages/${conversationId}?limit=${limit}&offset=${offset}`, {
        headers: {
          'apikey': process.env.REACT_APP_EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data);
        console.log(`📚 ${data.data.length} mensagens carregadas (cache: ${data.fromCache})`);
      } else {
        console.error('❌ Erro ao carregar mensagens:', data.error);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Selecionar conversa
  const selectConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Entrar na sala da conversa via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        roomId: conversation.id
      }));
    }
    
    // Carregar mensagens
    loadMessages(conversation.id);
  }, [loadMessages]);

  // Enviar mensagem
  const sendMessage = useCallback(async (to: string, message: string) => {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.REACT_APP_EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure'
        },
        body: JSON.stringify({ to, message })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Mensagem enviada:', data.data);
        return { success: true, data: data.data };
      } else {
        console.error('❌ Erro ao enviar mensagem:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }, []);

  // Inicializar
  useEffect(() => {
    connectWebSocket();
    loadConversations();
    
    // Ping periódico para manter conexão
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // A cada 30 segundos

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, loadConversations]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estado
    status,
    conversations,
    selectedConversation,
    messages,
    loading,
    wsConnected,
    
    // Ações
    loadConversations,
    loadMessages,
    selectConversation,
    sendMessage,
    
    // Utilitários
    isConnected: status.isReady && wsConnected
  };
};
