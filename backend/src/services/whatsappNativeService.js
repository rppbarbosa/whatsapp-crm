const { supabase, supabaseAdmin } = require('./supabase');

class WhatsAppNativeService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = {
      contacts: 5 * 60 * 1000, // 5 minutos
      messages: 2 * 60 * 1000, // 2 minutos
      conversations: 3 * 60 * 1000 // 3 minutos
    };
  }

  // ===== CONTATOS =====

  /**
   * Sincronizar contatos do WhatsApp com o banco
   */
  async syncContacts(instanceName, whatsappContacts) {
    try {
      console.log(`🔄 Sincronizando ${whatsappContacts.length} contatos para instância ${instanceName}`);
      
      // Preparar dados para upsert
      const contactsData = whatsappContacts.map(contact => ({
        id: contact.id, // ID nativo do WhatsApp
        name: contact.name || contact.phone,
        phone: contact.phone,
        is_group: contact.isGroup || false,
        is_wa_contact: contact.isWAContact || false,
        profile_pic_url: contact.profilePicUrl,
        status: contact.status,
        last_seen: contact.lastSeen,
        instance_name: instanceName
      }));

      // Upsert contatos
      const { data, error } = await supabaseAdmin
        .from('whatsapp_contacts')
        .upsert(contactsData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao sincronizar contatos:', error);
        throw error;
      }

      console.log(`✅ ${data.length} contatos sincronizados`);
      return data;
    } catch (error) {
      console.error('❌ Erro no syncContacts:', error);
      throw error;
    }
  }

  /**
   * Obter contatos de uma instância
   */
  async getContacts(instanceName, forceRefresh = false) {
    const cacheKey = `contacts_${instanceName}`;
    
    // Verificar cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout.contacts) {
        return cached.data;
      }
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('*')
        .eq('instance_name', instanceName)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter contatos:', error);
      throw error;
    }
  }

  // ===== MENSAGENS =====

  /**
   * Sincronizar mensagens do WhatsApp com o banco
   */
  async syncMessages(instanceName, whatsappMessages) {
    try {
      console.log(`🔄 Sincronizando ${whatsappMessages.length} mensagens para instância ${instanceName}`);
      
      // Preparar dados para upsert
      const messagesData = whatsappMessages.map(msg => ({
        id: msg.id, // ID nativo do WhatsApp
        from_id: msg.from,
        to_id: msg.to,
        body: msg.body || msg.content,
        type: msg.type || 'chat',
        timestamp: msg.timestamp,
        is_from_me: msg.isFromMe || false,
        media_url: msg.mediaUrl,
        media_type: msg.mediaType,
        media_filename: msg.mediaFilename,
        status: msg.status || 'sent',
        instance_name: instanceName
      }));

      // Upsert mensagens
      const { data, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .upsert(messagesData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao sincronizar mensagens:', error);
        throw error;
      }

      console.log(`✅ ${data.length} mensagens sincronizadas`);
      return data;
    } catch (error) {
      console.error('❌ Erro no syncMessages:', error);
      throw error;
    }
  }

  /**
   * Obter mensagens de uma conversa
   */
  async getConversationMessages(contactId, instanceName, limit = 50) {
    const cacheKey = `messages_${instanceName}_${contactId}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout.messages) {
        return cached.data;
      }
    }

    try {
      // Usar função do banco para melhor performance
      const { data, error } = await supabaseAdmin
        .rpc('get_conversation_messages', {
          contact_id_param: contactId,
          instance_name_param: instanceName,
          limit_count: limit
        });

      if (error) throw error;

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter mensagens da conversa:', error);
      throw error;
    }
  }

  // ===== CONVERSAS =====

  /**
   * Obter conversas de uma instância
   */
  async getConversations(instanceName, forceRefresh = false) {
    const cacheKey = `conversations_${instanceName}`;
    
    // Verificar cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout.conversations) {
        return cached.data;
      }
    }

    try {
      // Usar função do banco para melhor performance
      const { data, error } = await supabaseAdmin
        .rpc('get_instance_conversations', {
          instance_name_param: instanceName
        });

      if (error) throw error;

      // Salvar no cache
      this.cache.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error);
      throw error;
    }
  }

  /**
   * Obter conversas com dados do CRM
   */
  async getConversationsWithCRM(instanceName) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_conversations_with_crm')
        .select('*')
        .eq('instance_name', instanceName)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao obter conversas com CRM:', error);
      throw error;
    }
  }

  // ===== RELACIONAMENTOS CRM =====

  /**
   * Vincular contato a um lead
   */
  async linkContactToLead(contactId, leadId, notes = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .upsert({
          whatsapp_contact_id: contactId,
          lead_id: leadId,
          customer_id: null,
          pipeline_status: 'lead-bruto',
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;

      // Limpar cache relacionado
      this.clearCache(`conversations_`);
      this.clearCache(`contacts_`);

      return data;
    } catch (error) {
      console.error('❌ Erro ao vincular contato a lead:', error);
      throw error;
    }
  }

  /**
   * Vincular contato a um cliente
   */
  async linkContactToCustomer(contactId, customerId, notes = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .upsert({
          whatsapp_contact_id: contactId,
          lead_id: null,
          customer_id: customerId,
          pipeline_status: 'cliente',
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;

      // Limpar cache relacionado
      this.clearCache(`conversations_`);
      this.clearCache(`contacts_`);

      return data;
    } catch (error) {
      console.error('❌ Erro ao vincular contato a cliente:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do pipeline
   */
  async updatePipelineStatus(contactId, pipelineStatus) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .update({ pipeline_status: pipelineStatus })
        .eq('whatsapp_contact_id', contactId)
        .select()
        .single();

      if (error) throw error;

      // Limpar cache relacionado
      this.clearCache(`conversations_`);

      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar status do pipeline:', error);
      throw error;
    }
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Limpar cache específico
   */
  clearCache(pattern) {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpar todo o cache
   */
  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Obter estatísticas de cache
   */
  getCacheStats() {
    return {
      totalEntries: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: process.memoryUsage()
    };
  }

  // ===== UTILIDADES =====

  /**
   * Obter estatísticas da instância
   */
  async getInstanceStats(instanceName) {
    try {
      // Contar contatos
      const { count: contactsCount } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('instance_name', instanceName);

      // Contar mensagens
      const { count: messagesCount } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*', { count: 'exact', head: true })
        .eq('instance_name', instanceName);

      // Contar conversas
      const { count: conversationsCount } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('instance_name', instanceName)
        .eq('is_group', false);

      return {
        instance_name: instanceName,
        contacts_count: contactsCount || 0,
        messages_count: messagesCount || 0,
        conversations_count: conversationsCount || 0,
        cache_stats: this.getCacheStats()
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas da instância:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppNativeService(); 