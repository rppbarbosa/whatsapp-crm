import { useCallback, useEffect, useRef } from 'react';

interface CachedMessage {
  id: string;
  body: string;
  timestamp: number;
  from: string;
  to: string;
  isFromMe: boolean;
  type: string;
  author?: string;
  quotedMsg?: {
    body: string;
    author: string;
  };
}

interface CachedChat {
  chatId: string;
  messages: CachedMessage[];
  lastUpdated: number;
  totalMessages: number;
}

const CACHE_KEY = 'whatsapp-message-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

export const useMessageCache = () => {
  const cacheRef = useRef<Map<string, CachedChat>>(new Map());

  // Carregar cache do localStorage na inicialização
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        
        // Filtrar cache expirado
        const validCache = new Map();
        Object.entries(parsedCache).forEach(([chatId, chat]: [string, any]) => {
          if (now - chat.lastUpdated < CACHE_EXPIRY) {
            validCache.set(chatId, chat);
          }
        });
        
        cacheRef.current = validCache;
        console.log(`📦 Cache carregado: ${validCache.size} conversas`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      cacheRef.current = new Map();
    }
  }, []);

  // Salvar cache no localStorage
  const saveCache = useCallback(() => {
    try {
      const cacheObject = Object.fromEntries(cacheRef.current);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('❌ Erro ao salvar cache:', error);
    }
  }, []);

  // Obter mensagens do cache
  const getCachedMessages = useCallback((chatId: string): CachedMessage[] => {
    const cached = cacheRef.current.get(chatId);
    if (cached) {
      console.log(`📦 Mensagens do cache para ${chatId.substring(0, 20)}...: ${cached.messages.length}`);
      return cached.messages;
    }
    return [];
  }, []);

  // Salvar mensagens no cache
  const saveMessages = useCallback((chatId: string, messages: CachedMessage[], totalMessages: number) => {
    const now = Date.now();
    const existing = cacheRef.current.get(chatId);
    
    if (existing) {
      // Mesclar mensagens existentes com novas
      const existingIds = new Set(existing.messages.map(m => m.id));
      const newMessages = messages.filter(m => !existingIds.has(m.id));
      
      if (newMessages.length > 0) {
        const allMessages = [...existing.messages, ...newMessages]
          .sort((a, b) => a.timestamp - b.timestamp);
        
        cacheRef.current.set(chatId, {
          chatId,
          messages: allMessages,
          lastUpdated: now,
          totalMessages: Math.max(totalMessages, allMessages.length)
        });
        
        console.log(`📦 Cache atualizado para ${chatId.substring(0, 20)}...: +${newMessages.length} mensagens (total: ${allMessages.length})`);
        saveCache();
      }
    } else {
      // Primeira vez salvando para este chat
      cacheRef.current.set(chatId, {
        chatId,
        messages,
        lastUpdated: now,
        totalMessages
      });
      
      console.log(`📦 Cache criado para ${chatId.substring(0, 20)}...: ${messages.length} mensagens`);
      saveCache();
    }
  }, [saveCache]);

  // Adicionar nova mensagem ao cache
  const addNewMessage = useCallback((chatId: string, message: CachedMessage) => {
    const existing = cacheRef.current.get(chatId);
    
    if (existing) {
      // Verificar se a mensagem já existe
      const messageExists = existing.messages.some(m => m.id === message.id);
      
      if (!messageExists) {
        const updatedMessages = [...existing.messages, message]
          .sort((a, b) => a.timestamp - b.timestamp);
        
        cacheRef.current.set(chatId, {
          ...existing,
          messages: updatedMessages,
          lastUpdated: Date.now(),
          totalMessages: Math.max(existing.totalMessages, updatedMessages.length)
        });
        
        console.log(`📦 Nova mensagem adicionada ao cache para ${chatId.substring(0, 20)}...`);
        saveCache();
      }
    }
  }, [saveCache]);

  // Limpar cache de um chat específico
  const clearChatCache = useCallback((chatId: string) => {
    cacheRef.current.delete(chatId);
    saveCache();
    console.log(`📦 Cache limpo para ${chatId.substring(0, 20)}...`);
  }, [saveCache]);

  // Limpar todo o cache
  const clearAllCache = useCallback(() => {
    cacheRef.current.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log('📦 Todo o cache foi limpo');
  }, []);

  // Verificar se há mensagens em cache
  const hasCachedMessages = useCallback((chatId: string): boolean => {
    return cacheRef.current.has(chatId) && cacheRef.current.get(chatId)!.messages.length > 0;
  }, []);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    const stats = {
      totalChats: cacheRef.current.size,
      totalMessages: Array.from(cacheRef.current.values())
        .reduce((sum, chat) => sum + chat.messages.length, 0),
      oldestUpdate: Math.min(...Array.from(cacheRef.current.values())
        .map(chat => chat.lastUpdated))
    };
    
    return stats;
  }, []);

  return {
    getCachedMessages,
    saveMessages,
    addNewMessage,
    clearChatCache,
    clearAllCache,
    hasCachedMessages,
    getCacheStats
  };
};
