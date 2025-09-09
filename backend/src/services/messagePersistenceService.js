const { createClient } = require('@supabase/supabase-js');
const Redis = require('redis');

class MessagePersistenceService {
  constructor() {
    // Configuração do Supabase
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Configuração do Redis (opcional, para cache)
    this.redis = null;
    this.initRedis();
    
    // Cache em memória para mensagens ativas
    this.activeMessagesCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = Redis.createClient({ url: process.env.REDIS_URL });
        await this.redis.connect();
        console.log('✅ Redis conectado para cache de mensagens');
      }
    } catch (error) {
      console.log('⚠️ Redis não disponível, usando cache em memória:', error.message);
    }
  }

  // Salvar mensagem no Supabase imediatamente
  async saveMessage(message, instanceName) {
    try {
      const messageData = {
        id: message.id,
        from_id: message.from,
        to_id: message.to,
        body: message.body || message.caption || '',
        type: message.type || 'text',
        timestamp: message.timestamp,
        is_from_me: message.fromMe || false,
        media_url: message.mediaInfo?.url || null,
        media_type: message.mediaInfo?.type || null,
        media_filename: message.mediaInfo?.filename || null,
        status: 'received',
        conversation_id: this.getConversationId(message.from, message.to),
        instance_name: instanceName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Salvar no Supabase
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar mensagem no Supabase:', error);
        return { success: false, error: error.message };
      }

      // Adicionar ao cache em memória
      this.addToCache(messageData);

      // Notificar via WebSocket (se implementado)
      this.notifyNewMessage(messageData);

      console.log(`✅ Mensagem salva: ${message.id}`);
      return { success: true, data: messageData };

    } catch (error) {
      console.error('❌ Erro geral ao salvar mensagem:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter mensagens do Supabase com cache inteligente
  async getMessages(chatId, limit = 50, offset = 0) {
    try {
      // Verificar cache primeiro
      const cacheKey = `messages:${chatId}:${limit}:${offset}`;
      const cached = await this.getFromCache(cacheKey);
      
      if (cached) {
        console.log(`📦 Mensagens do cache: ${cached.length}`);
        return { success: true, data: cached, fromCache: true };
      }

      // Buscar no Supabase
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select(`
          id, from_id, to_id, body, type, timestamp, is_from_me,
          media_url, media_type, media_filename, status, conversation_id
        `)
        .or(`from_id.eq.${chatId},to_id.eq.${chatId}`)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        return { success: false, error: error.message };
      }

      // Processar e formatar mensagens
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        body: msg.body,
        timestamp: msg.timestamp,
        from: msg.from_id,
        to: msg.to_id,
        isFromMe: msg.is_from_me,
        type: msg.type,
        mediaInfo: msg.media_url ? {
          type: msg.media_type,
          url: msg.media_url,
          filename: msg.media_filename,
          hasMedia: true
        } : null
      }));

      // Salvar no cache
      await this.setCache(cacheKey, formattedMessages, 300); // 5 minutos

      console.log(`📚 ${formattedMessages.length} mensagens carregadas do Supabase`);
      return { success: true, data: formattedMessages, fromCache: false };

    } catch (error) {
      console.error('❌ Erro geral ao obter mensagens:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter conversas com última mensagem
  async getConversations(instanceName, limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select(`
          conversation_id,
          from_id,
          to_id,
          body,
          timestamp,
          is_from_me,
          type,
          media_type
        `)
        .eq('instance_name', instanceName)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        return { success: false, error: error.message };
      }

      // Agrupar por conversa e pegar última mensagem
      const conversationsMap = new Map();
      
      data.forEach(msg => {
        const convId = msg.conversation_id;
        if (!conversationsMap.has(convId)) {
          conversationsMap.set(convId, {
            id: convId,
            lastMessage: {
              body: msg.body,
              timestamp: msg.timestamp,
              isFromMe: msg.is_from_me,
              type: msg.type
            },
            unreadCount: 0
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .slice(0, limit);

      console.log(`💬 ${conversations.length} conversas encontradas`);
      return { success: true, data: conversations };

    } catch (error) {
      console.error('❌ Erro geral ao obter conversas:', error);
      return { success: false, error: error.message };
    }
  }

  // Cache helpers
  addToCache(message) {
    const key = `active:${message.conversation_id}`;
    if (!this.activeMessagesCache.has(key)) {
      this.activeMessagesCache.set(key, []);
    }
    
    const messages = this.activeMessagesCache.get(key);
    messages.push(message);
    
    // Manter apenas últimas 100 mensagens por conversa
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }
  }

  async getFromCache(key) {
    if (this.redis) {
      try {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } catch (error) {
        console.log('⚠️ Erro no cache Redis:', error.message);
      }
    }
    return null;
  }

  async setCache(key, data, ttlSeconds = 300) {
    if (this.redis) {
      try {
        await this.redis.setEx(key, ttlSeconds, JSON.stringify(data));
      } catch (error) {
        console.log('⚠️ Erro ao salvar no cache Redis:', error.message);
      }
    }
  }

  getConversationId(from, to) {
    // Gerar ID consistente para a conversa
    const participants = [from, to].sort();
    return `${participants[0]}_${participants[1]}`;
  }

  notifyNewMessage(message) {
    // TODO: Implementar notificação WebSocket
    console.log(`🔔 Nova mensagem para notificar: ${message.id}`);
  }

  // Limpar cache expirado
  cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, data] of this.activeMessagesCache.entries()) {
      if (now - data.timestamp > this.cacheExpiry) {
        this.activeMessagesCache.delete(key);
      }
    }
  }
}

module.exports = new MessagePersistenceService();
