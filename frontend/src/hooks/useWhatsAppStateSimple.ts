import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { whatsappApi, WhatsAppStatus, Chat, Message } from '../services/apiSimple';

export const useWhatsAppStateSimple = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    status: 'disconnected',
    isReady: false
  });
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Carregar status do WhatsApp
  const loadStatus = useCallback(async () => {
    try {
      const response = await whatsappApi.getStatus();
      if (response.data.success) {
        setStatus(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  }, []);

  // Inicializar WhatsApp
  const initializeWhatsApp = useCallback(async () => {
    try {
      setLoading(true);
      const response = await whatsappApi.initialize();
      if (response.data.success) {
        toast.success('WhatsApp inicializado!');
        await loadStatus();
      } else {
        toast.error('Erro ao inicializar WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error);
      toast.error('Erro ao inicializar WhatsApp');
    } finally {
      setLoading(false);
    }
  }, [loadStatus]);

  // Carregar conversas
  const loadChats = useCallback(async () => {
    try {
      // console.log('🔄 Carregando conversas...');
      const response = await whatsappApi.getChats();
      console.log('📡 Resposta da API:', response.data);
      if (response.data.success) {
        console.log('✅ Conversas carregadas:', response.data.data.length);
        console.log('📋 Primeiras 3 conversas:', response.data.data.slice(0, 3));
        setChats(response.data.data);
      } else {
        console.log('❌ Erro ao carregar conversas:', response.data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
    }
  }, []);

  // Carregar mensagens de uma conversa com histórico
  const loadMessages = useCallback(async (chatId: string, loadHistory: boolean = true) => {
    try {
      console.log('📱 Carregando mensagens para:', chatId.substring(0, 20) + '...');
      setLoadingHistory(loadHistory);
      
      const response = await whatsappApi.getMessages(chatId, 50, loadHistory);
      if (response.data.success) {
        console.log('✅ Mensagens carregadas:', response.data.data.length);
        console.log('📚 Total de mensagens no histórico:', response.data.totalMessages);
        
        setMessages(response.data.data);
        setHasMoreHistory(response.data.hasMoreHistory || false);
        setTotalMessages(response.data.totalMessages || 0);
        
        if (loadHistory && response.data.totalMessages) {
          toast.success(`📚 Histórico carregado: ${response.data.totalMessages} mensagens`, {
            duration: 3000,
            icon: '📚'
          });
        }
      } else {
        console.log('❌ Erro ao carregar mensagens:', response.data);
        setMessages([]);
        setHasMoreHistory(false);
        setTotalMessages(0);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      setMessages([]);
      setHasMoreHistory(false);
      setTotalMessages(0);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Carregar mensagens anteriores (scroll infinito)
  const loadEarlierMessages = useCallback(async () => {
    if (!selectedChat || !hasMoreHistory || loadingHistory) return;

    try {
      setLoadingHistory(true);
      console.log('📜 Carregando mensagens anteriores...');
      
      // Pegar a mensagem mais antiga atual como referência
      const oldestMessage = messages[0];
      if (!oldestMessage) return;
      
      const response = await whatsappApi.getEarlierMessages(selectedChat.id, oldestMessage.id, 50);
      if (response.data.success && response.data.data.length > 0) {
        console.log('✅ Mensagens anteriores carregadas:', response.data.data.length);
        
        // Adicionar mensagens anteriores no início da lista
        setMessages(prevMessages => [...response.data.data, ...prevMessages]);
        setHasMoreHistory(response.data.hasMore || false);
        
        toast.success(`📜 +${response.data.data.length} mensagens antigas carregadas`, {
          duration: 2000,
          icon: '📜'
        });
      } else {
        setHasMoreHistory(false);
        toast('📭 Não há mais mensagens antigas', {
          duration: 2000,
          icon: '📭'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens anteriores:', error);
      toast.error('Erro ao carregar mensagens antigas');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedChat, hasMoreHistory, loadingHistory, messages]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string) => {
    if (!selectedChat || !status.isReady) return;
    
    try {
      const response = await whatsappApi.sendMessage(selectedChat.id, message);
      if (response.data.success) {
        toast.success('Mensagem enviada!');
        // Recarregar mensagens
        await loadMessages(selectedChat.id);
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  }, [selectedChat, status.isReady, loadMessages]);

  // Selecionar conversa
  const selectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    setMessages([]); // Limpar mensagens anteriores
    setHasMoreHistory(false);
    setTotalMessages(0);
    loadMessages(chat.id, true); // Carregar com histórico por padrão
  }, [loadMessages]);

  // Carregar dados iniciais
  useEffect(() => {
    loadStatus();
    // Forçar carregamento de conversas imediatamente
    console.log('🚀 Carregamento forçado de conversas na inicialização');
    loadChats();
  }, [loadStatus, loadChats]);

  // Atualizar status periodicamente (apenas quando não conectado)
  useEffect(() => {
    if (status.status !== 'connected') {
      const interval = setInterval(() => {
        loadStatus();
      }, 10000); // 10 segundos quando não conectado

      return () => clearInterval(interval);
    }
  }, [loadStatus, status.status]);

  // Carregar conversas quando conectar ou inicializar
  useEffect(() => {
    if (status.status === 'connected' || status.isReady) {
      console.log('🚀 Status conectado, carregando conversas...', { status: status.status, isReady: status.isReady });
      loadChats();
    }
  }, [status.status, status.isReady, loadChats]);
  
  // Carregar conversas na inicialização (para dados de demonstração)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏰ Carregamento inicial de conversas...');
      loadChats();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [loadChats]);

  // Polling para atualizar mensagens da conversa selecionada (sem histórico)
  useEffect(() => {
    if (selectedChat && status.status === 'connected' && !isUserScrolling) {
      console.log('🔄 Iniciando polling de mensagens para:', selectedChat.name);
      
      const interval = setInterval(() => {
        if (!isUserScrolling) {
          // console.log('🔄 Atualizando mensagens automaticamente...');
          loadMessages(selectedChat.id, false); // Sem histórico no polling para ser mais rápido
        }
      }, 10000); // Reduzido para 10 segundos

      return () => {
        console.log('⏹️ Parando polling de mensagens');
        clearInterval(interval);
      };
    }
  }, [selectedChat, status.status, loadMessages, isUserScrolling]);

  // Polling para atualizar lista de conversas (para contador não lidas)
  useEffect(() => {
    if (status.status === 'connected') {
      console.log('🔄 Iniciando polling de conversas para contadores não lidas...');
      
      const interval = setInterval(() => {
        // console.log('📊 Atualizando lista de conversas...');
        loadChats();
      }, 30000); // Reduzido para 30 segundos

      return () => {
        console.log('⏹️ Parando polling de conversas');
        clearInterval(interval);
      };
    }
  }, [status.status, loadChats]);

  return {
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
    loadStatus,
    loadChats,
    loadMessages,
    loadEarlierMessages,
    sendMessage,
    selectChat,
    setIsUserScrolling,
    setShouldAutoScroll
  };
};
