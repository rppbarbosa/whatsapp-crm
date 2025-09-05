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
      console.log('🔄 Carregando conversas...');
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

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      console.log('📱 Carregando mensagens para:', chatId.substring(0, 20) + '...');
      const response = await whatsappApi.getMessages(chatId, 20); // Limitar a 20 mensagens
      if (response.data.success) {
        console.log('✅ Mensagens carregadas:', response.data.data.length);
        setMessages(response.data.data);
      } else {
        console.log('❌ Erro ao carregar mensagens:', response.data);
        setMessages([]); // Limpar mensagens em caso de erro
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
      setMessages([]); // Limpar mensagens em caso de erro
    }
  }, []);

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
    loadMessages(chat.id);
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

  // Polling para atualizar mensagens da conversa selecionada
  useEffect(() => {
    if (selectedChat && status.status === 'connected') {
      console.log('🔄 Iniciando polling de mensagens para:', selectedChat.name);
      
      const interval = setInterval(() => {
        console.log('🔄 Atualizando mensagens automaticamente...');
        loadMessages(selectedChat.id);
      }, 3000); // Atualizar a cada 3 segundos

      return () => {
        console.log('⏹️ Parando polling de mensagens');
        clearInterval(interval);
      };
    }
  }, [selectedChat, status.status, loadMessages]);

  // Polling para atualizar lista de conversas (para contador não lidas)
  useEffect(() => {
    if (status.status === 'connected') {
      console.log('🔄 Iniciando polling de conversas para contadores não lidas...');
      
      const interval = setInterval(() => {
        console.log('📊 Atualizando lista de conversas...');
        loadChats();
      }, 5000); // Atualizar lista a cada 5 segundos

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
    initializeWhatsApp,
    loadStatus,
    loadChats,
    loadMessages,
    sendMessage,
    selectChat
  };
};
