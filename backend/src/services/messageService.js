const { supabaseAdmin } = require('./supabase');
const { v4: uuidv4 } = require('uuid');

class MessageService {
  constructor() {
    this.supabase = supabaseAdmin;
  }

  // Gerar ID único para mensagem
  generateMessageId() {
    return uuidv4();
  }

  // Gerar ID de conversa baseado nos números
  generateConversationId(fromNumber, toNumber, instanceName) {
    // Ordenar números para garantir consistência
    const sortedNumbers = [fromNumber, toNumber].sort();
    return `${instanceName}_${sortedNumbers[0]}_${sortedNumbers[1]}`;
  }

  // Salvar mensagem no banco
  async saveMessage(messageData) {
    try {
      const {
        instanceName,
        messageId,
        fromNumber,
        toNumber,
        messageType = 'text',
        messageContent,
        mediaUrl = null,
        mediaType = null,
        isFromMe = false,
        status = 'received',
        metadata = {}
      } = messageData;

      // Criar contatos automaticamente se não existirem
      await this.ensureContactExists(instanceName, fromNumber);
      await this.ensureContactExists(instanceName, toNumber);

      // Gerar ID de conversa
      const conversationId = this.generateConversationId(fromNumber, toNumber, instanceName);

      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .insert({
          id: messageId,
          from_id: fromNumber,
          to_id: toNumber,
          body: messageContent,
          type: messageType,
          message_timestamp: Math.floor(Date.now() / 1000), // Corrigido: usar message_timestamp
          is_from_me: isFromMe,
          media_url: mediaUrl,
          media_type: mediaType,
          status: status,
          conversation_id: conversationId,
          instance_name: instanceName
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log(`✅ Mensagem salva com sucesso: ${messageId}`);
      return data;

    } catch (error) {
      console.error('❌ Erro ao salvar mensagem:', error);
      throw error;
    }
  }

  // Salvar mensagem recebida
  async saveReceivedMessage(instanceName, message) {
    try {
      const messageData = {
        instanceName,
        messageId: message.key.id,
        fromNumber: message.key.remoteJid.split('@')[0],
        toNumber: message.key.participant || message.key.remoteJid.split('@')[0],
        messageType: this.getMessageType(message),
        messageContent: this.extractMessageContent(message),
        mediaUrl: this.extractMediaUrl(message),
        mediaType: this.extractMediaType(message),
        isFromMe: false,
        status: 'received',
        metadata: {
          messageType: message.message ? Object.keys(message.message)[0] : 'unknown',
          hasQuotedMessage: !!message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
          timestamp: message.messageTimestamp
        }
      };

      return await this.saveMessage(messageData);

    } catch (error) {
      console.error('❌ Erro ao salvar mensagem recebida:', error);
      throw error;
    }
  }

  // Salvar mensagem enviada
  async saveSentMessage(instanceName, toNumber, messageContent, messageId = null) {
    try {
      const messageData = {
        instanceName,
        messageId: messageId || this.generateMessageId(),
        fromNumber: 'me', // Será atualizado quando a mensagem for confirmada
        toNumber: toNumber.split('@')[0],
        messageType: 'text',
        messageContent,
        isFromMe: true,
        status: 'sent',
        metadata: {
          timestamp: new Date().toISOString()
        }
      };

      return await this.saveMessage(messageData);

    } catch (error) {
      console.error('❌ Erro ao salvar mensagem enviada:', error);
      throw error;
    }
  }

  // Extrair tipo da mensagem
  getMessageType(message) {
    if (!message.message) return 'unknown';
    
    const messageTypes = Object.keys(message.message);
    if (messageTypes.includes('textMessage') || messageTypes.includes('conversation')) {
      return 'text';
    } else if (messageTypes.includes('imageMessage')) {
      return 'image';
    } else if (messageTypes.includes('audioMessage')) {
      return 'audio';
    } else if (messageTypes.includes('videoMessage')) {
      return 'video';
    } else if (messageTypes.includes('documentMessage')) {
      return 'document';
    }
    
    return 'unknown';
  }

  // Extrair conteúdo da mensagem
  extractMessageContent(message) {
    if (!message.message) return '';
    
    if (message.message.conversation) {
      return message.message.conversation;
    } else if (message.message.extendedTextMessage) {
      return message.message.extendedTextMessage.text;
    } else if (message.message.textMessage) {
      return message.message.textMessage.text;
    }
    
    return '';
  }

  // Extrair URL da mídia
  extractMediaUrl(message) {
    if (!message.message) return null;
    
    const messageTypes = Object.keys(message.message);
    for (const type of messageTypes) {
      if (message.message[type]?.url) {
        return message.message[type].url;
      }
    }
    
    return null;
  }

  // Extrair tipo da mídia
  extractMediaType(message) {
    if (!message.message) return null;
    
    const messageTypes = Object.keys(message.message);
    for (const type of messageTypes) {
      if (type.endsWith('Message')) {
        return type.replace('Message', '');
      }
    }
    
    return null;
  }

  // Obter mensagem por ID
  async getMessageById(messageId) {
    try {
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erro ao buscar mensagem por ID:', error);
        throw error;
      }

      return data || null;

    } catch (error) {
      console.error('❌ Erro ao buscar mensagem por ID:', error);
      return null;
    }
  }

  // Obter mensagens de uma conversa
  async getConversationMessages(instanceName, conversationId, limit = 50, offset = 0) {
    try {
      console.log(`💬 Buscando mensagens da conversa ${conversationId} na instância ${instanceName}`);
      
      // Primeiro, tentar buscar da tabela whatsapp_messages
      const { data, error } = await this.supabase
        .from('whatsapp_messages')
        .select('id, from_id, to_id, body, type, message_timestamp, is_from_me, media_url, media_type, status, instance_name')
        .eq('instance_name', instanceName)
        .eq('conversation_id', conversationId)
        .order('message_timestamp', { ascending: true }) // Ordenar por timestamp crescente para mostrar cronologicamente
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar mensagens da conversa:', error);
        throw error;
      }

      console.log(`📨 ${data?.length || 0} mensagens encontradas para conversa ${conversationId}`);

      // Se não há mensagens, retornar array vazio
      if (!data || data.length === 0) {
        console.log(`⚠️ Nenhuma mensagem encontrada para conversa ${conversationId}`);
        return [];
      }

      // Formatar mensagens para o formato esperado pelo frontend
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        from_id: msg.from_id,
        to_id: msg.to_id,
        body: msg.body || 'Mensagem de mídia',
        type: msg.type || 'text',
        timestamp: msg.message_timestamp || Math.floor(Date.now() / 1000),
        is_from_me: msg.is_from_me || false,
        media_url: msg.media_url,
        media_type: msg.media_type,
        status: msg.status || 'sent',
        instance_name: msg.instance_name,
        created_at: msg.created_at || new Date().toISOString(),
        updated_at: msg.updated_at || new Date().toISOString()
      }));

      return formattedMessages;

    } catch (error) {
      console.error('❌ Erro ao buscar mensagens da conversa:', error);
      throw error;
    }
  }

  // Obter conversas de uma instância
  async getInstanceConversations(instanceName, limit = 20) {
    try {
      console.log(`📱 Buscando conversas da instância: ${instanceName}`);
      
      // Primeiro, tentar buscar da tabela conversations (fonte principal)
      const { data: conversationsData, error: conversationsError } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('whatsapp_instance', instanceName)
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (conversationsError) {
        console.error('❌ Erro ao buscar conversas da tabela conversations:', conversationsError);
        throw conversationsError;
      }

      console.log(`📨 ${conversationsData?.length || 0} conversas encontradas na tabela conversations`);

      // Se não há conversas na tabela conversations, buscar de whatsapp_messages como fallback
      if (!conversationsData || conversationsData.length === 0) {
        console.log('⚠️ Nenhuma conversa encontrada na tabela conversations, buscando em whatsapp_messages...');
        
        const { data: messagesData, error: messagesError } = await this.supabase
          .from('whatsapp_messages')
          .select('conversation_id, from_id, to_id, body, message_timestamp, is_from_me, instance_name')
          .eq('instance_name', instanceName)
          .order('message_timestamp', { ascending: false });

        if (messagesError) {
          console.error('❌ Erro ao buscar mensagens da instância:', messagesError);
          throw messagesError;
        }

        // Agrupar por conversa e pegar a última mensagem
        const conversations = new Map();
        
        messagesData.forEach(message => {
          if (!conversations.has(message.conversation_id)) {
            conversations.set(message.conversation_id, {
              contact_id: message.conversation_id,
              contact_name: message.is_from_me ? message.to_id : message.from_id,
              contact_phone: message.is_from_me ? message.to_id : message.from_id,
              last_message_body: message.body || 'Mensagem de mídia',
              last_message_timestamp: message.message_timestamp || Math.floor(Date.now() / 1000),
              message_count: 1,
              instance_name: instanceName
            });
          } else {
            // Incrementar contador de mensagens
            const existing = conversations.get(message.conversation_id);
            existing.message_count += 1;
            
            // Atualizar última mensagem se for mais recente
            if (message.message_timestamp > existing.last_message_timestamp) {
              existing.last_message_body = message.body || 'Mensagem de mídia';
              existing.last_message_timestamp = message.message_timestamp;
            }
          }
        });

        const fallbackConversations = Array.from(conversations.values()).slice(0, limit);
        console.log(`📨 ${fallbackConversations.length} conversas encontradas via fallback`);
        return fallbackConversations;
      }

      // Formatar dados da tabela conversations para o formato esperado
      const formattedConversations = conversationsData.map(conv => ({
        contact_id: conv.id,
        contact_name: conv.whatsapp_number || 'Contato',
        contact_phone: conv.whatsapp_number || 'N/A',
        contact_avatar: null, // Será implementado posteriormente
        contact_status: conv.pipeline_status || 'active',
        contact_is_business: false, // Será implementado posteriormente
        contact_is_verified: false, // Será implementado posteriormente
        last_message_body: 'Última mensagem', // Será implementado posteriormente
        last_message_timestamp: conv.last_message_at ? Math.floor(new Date(conv.last_message_at).getTime() / 1000) : Math.floor(Date.now() / 1000),
        message_count: 0, // Será implementado posteriormente
        instance_name: instanceName
      }));

      console.log(`✅ ${formattedConversations.length} conversas formatadas com sucesso`);
      return formattedConversations;

    } catch (error) {
      console.error('❌ Erro ao buscar conversas da instância:', error);
      throw error;
    }
  }

  // Atualizar status de uma mensagem
  async updateMessageStatus(messageId, status) {
    try {
      const { error } = await this.supabase
        .from('whatsapp_messages')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId); // Corrigido: usar 'id' em vez de 'message_id'

      if (error) {
        console.error('❌ Erro ao atualizar status da mensagem:', error);
        throw error;
      }

      console.log(`✅ Status da mensagem ${messageId} atualizado para: ${status}`);

    } catch (error) {
      console.error('❌ Erro ao atualizar status da mensagem:', error);
      throw error;
    }
  }

  // Deletar mensagem
  async deleteMessage(messageId) {
    try {
      const { error } = await this.supabase
        .from('whatsapp_messages')
        .delete()
        .eq('id', messageId); // Corrigido: usar 'id' em vez de 'message_id'

      if (error) {
        console.error('❌ Erro ao deletar mensagem:', error);
        throw error;
      }

      console.log(`✅ Mensagem ${messageId} deletada com sucesso`);

    } catch (error) {
      console.error('❌ Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  // Obter estatísticas de mensagens de uma instância
  async getMessageStats(instanceName) {
    try {
      // Total de mensagens
      const { count: totalMessages, error: totalError } = await this.supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('instance_name', instanceName);

      if (totalError) throw totalError;

      // Total de conversas
      const { count: totalConversations, error: conversationsError } = await this.supabase
        .from('whatsapp_messages')
        .select('conversation_id', { count: 'exact', head: true })
        .eq('instance_name', instanceName);

      if (conversationsError) throw conversationsError;

      // Mensagens hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: messagesToday, error: todayError } = await this.supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('instance_name', instanceName)
        .gte('message_timestamp', Math.floor(today.getTime() / 1000)); // Corrigido: usar message_timestamp e converter para Unix timestamp

      if (todayError) throw todayError;

      return {
        totalMessages: totalMessages || 0,
        totalConversations: totalConversations || 0,
        messagesToday: messagesToday || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de mensagens:', error);
      throw error;
    }
  }

  // Garantir que um contato existe na tabela
  async ensureContactExists(instanceName, contactId) {
    try {
      // Verificar se o contato já existe
      const { data: existingContact, error: checkError } = await this.supabase
        .from('whatsapp_contacts')
        .select('id')
        .eq('id', contactId)
        .eq('instance_name', instanceName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar contato:', checkError);
        return;
      }

      // Se o contato não existe, criar
      if (!existingContact) {
        const isGroup = contactId.includes('@g.us');
        const phone = isGroup ? contactId : contactId.split('@')[0];
        const name = isGroup ? `Grupo ${phone}` : `Contato ${phone}`;

                 const { error: insertError } = await this.supabase
           .from('whatsapp_contacts')
           .insert({
             id: contactId,
             name: name,
             phone: isGroup ? contactId.substring(0, 20) : phone, // Para grupos, usar ID truncado
             is_group: isGroup,
             is_wa_contact: true,
             has_messages: true,
             instance_name: instanceName
           });

        if (insertError) {
          console.error('❌ Erro ao criar contato:', insertError);
        } else {
          console.log(`✅ Contato criado automaticamente: ${contactId}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao garantir existência do contato:', error);
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { count, error } = await this.supabase
        .from('whatsapp_messages')
        .select('id', { count: 'exact', head: true }); // Corrigido: selecionar apenas 'id' para performance

      if (error) {
        throw error;
      }

      return {
        status: 'healthy',
        totalMessages: count || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new MessageService();
