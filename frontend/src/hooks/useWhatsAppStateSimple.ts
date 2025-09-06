import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { whatsappApi, WhatsAppStatus, Chat, Message } from '../services/apiSimple';
import { useMessageCache } from './useMessageCache';

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

  // Refs para controle de scroll
  const isInitialLoad = useRef(false);
  const previousMessagesLength = useRef(0);

  // Hook de cache de mensagens
  const {
    getCachedMessages,
    saveMessages
  } = useMessageCache();

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
      
      // Primeiro, sempre carregar do cache se disponível
      const cachedMessages = getCachedMessages(chatId);
      if (cachedMessages.length > 0) {
        console.log('📦 Carregando mensagens do cache:', cachedMessages.length);
        setMessages(cachedMessages);
        setTotalMessages(cachedMessages.length);
        setHasMoreHistory(cachedMessages.length >= 50);
        
        // Se não é carregamento de histórico, usar cache e retornar
        if (!loadHistory) {
          setLoadingHistory(false);
          return;
        }
      }
      
      // Buscar do backend para sincronizar
      const response = await whatsappApi.getMessages(chatId, 50, loadHistory);
      if (response.data.success) {
        console.log('✅ Mensagens carregadas do backend:', response.data.data.length);
        console.log('📚 Total de mensagens no histórico:', response.data.totalMessages);
        
        // Mesclar com cache se existir
        let finalMessages = response.data.data;
        if (cachedMessages.length > 0) {
          const backendTimestamps = new Set(response.data.data.map(m => m.timestamp));
          const newCachedMessages = cachedMessages.filter(m => !backendTimestamps.has(m.timestamp));
          finalMessages = [...response.data.data, ...newCachedMessages]
            .sort((a, b) => a.timestamp - b.timestamp);
        }
        
        // Salvar no cache
        saveMessages(chatId, finalMessages, response.data.totalMessages || 0);
        
        setMessages(finalMessages);
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
        // Se erro, usar cache se disponível
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
          setTotalMessages(cachedMessages.length);
          setHasMoreHistory(cachedMessages.length >= 50);
        } else {
          setMessages([]);
          setHasMoreHistory(false);
          setTotalMessages(0);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      // Se erro, usar cache se disponível
      const cachedMessages = getCachedMessages(chatId);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        setTotalMessages(cachedMessages.length);
        setHasMoreHistory(cachedMessages.length >= 50);
      } else {
        setMessages([]);
        setHasMoreHistory(false);
        setTotalMessages(0);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [getCachedMessages, saveMessages]);

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
    console.log('👤 Selecionando conversa:', chat.name);
    setSelectedChat(chat);
    setShouldAutoScroll(true); // Sempre ativa scroll ao abrir nova conversa
    isInitialLoad.current = true; // Força scroll na primeira carga
    previousMessagesLength.current = 0; // Reset contador
    
    // Carregar mensagens da conversa selecionada
    loadMessages(chat.id, true); // Sempre carregar histórico ao selecionar
    
    // Forçar sincronização imediata para detectar mensagens novas
    setTimeout(async () => {
      try {
        const response = await whatsappApi.getMessages(chat.id, 50, false);
        if (response.data.success) {
          const backendMessages = response.data.data;
          const cachedMessages = getCachedMessages(chat.id);
          
          // Verificar se há mensagens novas
          const cachedTimestamps = new Set(cachedMessages.map(m => m.timestamp));
          const newMessages = backendMessages.filter(m => !cachedTimestamps.has(m.timestamp));
          
          if (newMessages.length > 0) {
            console.log(`🔄 Sincronização: ${newMessages.length} mensagens novas encontradas`);
            
            // Mesclar e salvar
            const allMessages = [...cachedMessages, ...newMessages]
              .sort((a, b) => a.timestamp - b.timestamp);
            
            saveMessages(chat.id, allMessages, response.data.totalMessages || 0);
            setMessages(allMessages);
            setTotalMessages(response.data.totalMessages || 0);
          }
        }
      } catch (error) {
        console.error('❌ Erro na sincronização:', error);
      }
    }, 500);
  }, [loadMessages, getCachedMessages, saveMessages]);

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
      
      const interval = setInterval(async () => {
        if (!isUserScrolling) {
          try {
            // Buscar mensagens do backend para detectar novas
            const response = await whatsappApi.getMessages(selectedChat.id, 50, false);
            if (response.data.success) {
              const backendMessages = response.data.data;
              const cachedMessages = getCachedMessages(selectedChat.id);
              
              // Verificar se há mensagens novas comparando timestamps
              const cachedTimestamps = new Set(cachedMessages.map(m => m.timestamp));
              const newMessages = backendMessages.filter(m => !cachedTimestamps.has(m.timestamp));
              
              if (newMessages.length > 0) {
                console.log(`🆕 ${newMessages.length} mensagens novas detectadas para ${selectedChat.name}`);
                
                // Mesclar mensagens: cache + novas, ordenadas por timestamp
                const allMessages = [...cachedMessages, ...newMessages]
                  .sort((a, b) => a.timestamp - b.timestamp);
                
                // Salvar no cache
                saveMessages(selectedChat.id, allMessages, response.data.totalMessages || 0);
                
                // Atualizar estado
                setMessages(allMessages);
                setTotalMessages(response.data.totalMessages || 0);
                
                // Notificar usuário sobre nova mensagem
                if (newMessages.some(m => !m.isFromMe)) {
                  toast.success(`📨 Nova mensagem de ${selectedChat.name}`, {
                    duration: 2000,
                    icon: '📨'
                  });
                }
              } else {
                // Mesmo sem mensagens novas, atualizar estado com cache
                setMessages(cachedMessages);
              }
            }
          } catch (error) {
            console.error('❌ Erro no polling de mensagens:', error);
          }
        }
      }, 2000); // Reduzido para 2 segundos para detectar mensagens mais rapidamente

      return () => {
        console.log('⏹️ Parando polling de mensagens');
        clearInterval(interval);
      };
    }
  }, [selectedChat, status.status, isUserScrolling, getCachedMessages, saveMessages]);

  // Polling para atualizar lista de conversas (para contador não lidas)
  useEffect(() => {
    if (status.status === 'connected') {
      console.log('🔄 Iniciando polling de conversas para contadores não lidas...');
      
      const interval = setInterval(async () => {
        try {
          // Atualizar lista de conversas
          await loadChats();
          
          // Para cada conversa com mensagens não lidas, atualizar cache
          const chatsWithUnread = chats.filter(chat => chat.unreadCount && chat.unreadCount > 0);
          
          for (const chat of chatsWithUnread) {
            try {
              const response = await whatsappApi.getMessages(chat.id, 50, false);
              if (response.data.success) {
                // Atualizar cache com mensagens mais recentes
                saveMessages(chat.id, response.data.data, response.data.totalMessages || 0);
                console.log(`📦 Cache atualizado para ${chat.name} (${chat.unreadCount} não lidas)`);
              }
            } catch (error) {
              console.error(`❌ Erro ao atualizar cache para ${chat.name}:`, error);
            }
          }
        } catch (error) {
          console.error('❌ Erro no polling de conversas:', error);
        }
      }, 30000); // Reduzido para 30 segundos

      return () => {
        console.log('⏹️ Parando polling de conversas');
        clearInterval(interval);
      };
    }
  }, [status.status, loadChats, chats, saveMessages]);

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
