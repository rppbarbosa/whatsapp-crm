const evolutionApiService = require('./evolutionApi');
const { supabase, supabaseAdmin } = require('./supabase');

class WhatsAppCompatibilityService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = {
      contacts: 60 * 60 * 1000, // 1 hora
      messages: 24 * 60 * 60 * 1000, // 24 horas
      status: 60 * 60 * 1000 // 1 hora
    };
  }

  // ===== COMPATIBILIDADE COM WHATSAPP API =====

  /**
   * Obter contatos com cache inteligente
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
      // Verificar se a instância existe e está conectada
      const activeInstances = evolutionApiService.getInstances();
      let instance = activeInstances.find(inst => inst.instance.instanceName === instanceName);
      
      // Se não encontrou nas instâncias ativas, verificar no banco de dados
      if (!instance) {
        console.log(`🔍 Instância ${instanceName} não encontrada nas ativas, verificando banco...`);
        
        const { data: dbInstances, error: dbError } = await supabaseAdmin
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_name', instanceName)
          .single();

        if (dbError || !dbInstances) {
          throw new Error(`Instance ${instanceName} not found in database`);
        }

        // Verificar se a instância está conectada no banco
        if (dbInstances.status !== 'connected') {
          throw new Error(`Instance ${instanceName} is not connected (status: ${dbInstances.status})`);
        }

        // Tentar reconectar a instância se ela estiver no banco mas não ativa
        console.log(`🔄 Tentando reconectar instância ${instanceName}...`);
        try {
          await evolutionApiService.createInstance(instanceName);
          // Aguardar um pouco para a conexão ser estabelecida
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Verificar novamente se agora está ativa
          const updatedActiveInstances = evolutionApiService.getInstances();
          instance = updatedActiveInstances.find(inst => inst.instance.instanceName === instanceName);
          
          if (!instance) {
            throw new Error(`Failed to reconnect instance ${instanceName}`);
          }
        } catch (reconnectError) {
          console.error(`❌ Erro ao reconectar instância ${instanceName}:`, reconnectError);
          throw new Error(`Instance exists but cannot be reconnected: ${reconnectError.message}`);
        }
      }
      
      if (instance.instance.status !== 'connected') {
        throw new Error(`Instance ${instanceName} is not connected (status: ${instance.instance.status})`);
      }

      // Buscar do WhatsApp
      const whatsappContacts = await evolutionApiService.getContacts(instanceName);
      
      // Enriquecer com dados do CRM
      const enrichedContacts = await this.enrichContactsWithCRMData(whatsappContacts, instanceName);
      
      // Salvar no cache
      this.cache.set(cacheKey, {
        data: enrichedContacts,
        timestamp: Date.now()
      });

      return enrichedContacts;
    } catch (error) {
      console.error(`Erro ao obter contatos de ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Obter mensagens com cache inteligente
   */
  async getMessages(instanceName, contactId = null, limit = 50, forceRefresh = false) {
    const cacheKey = `messages_${instanceName}_${contactId || 'all'}`;
    
    // Verificar cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout.messages) {
        return cached.data;
      }
    }

    try {
      // Verificar se a instância existe e está conectada
      const activeInstances = evolutionApiService.getInstances();
      let instance = activeInstances.find(inst => inst.instance.instanceName === instanceName);
      
      // Se não encontrou nas instâncias ativas, verificar no banco de dados
      if (!instance) {
        console.log(`🔍 Instância ${instanceName} não encontrada nas ativas, verificando banco...`);
        
        const { data: dbInstances, error: dbError } = await supabaseAdmin
          .from('whatsapp_instances')
          .select('*')
          .eq('instance_name', instanceName)
          .single();

        if (dbError || !dbInstances) {
          throw new Error(`Instance ${instanceName} not found in database`);
        }

        // Verificar se a instância está conectada no banco
        if (dbInstances.status !== 'connected') {
          throw new Error(`Instance ${instanceName} is not connected (status: ${dbInstances.status})`);
        }

        // Tentar reconectar a instância se ela estiver no banco mas não ativa
        console.log(`🔄 Tentando reconectar instância ${instanceName}...`);
        try {
          await evolutionApiService.createInstance(instanceName);
          // Aguardar um pouco para a conexão ser estabelecida
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Verificar novamente se agora está ativa
          const updatedActiveInstances = evolutionApiService.getInstances();
          instance = updatedActiveInstances.find(inst => inst.instance.instanceName === instanceName);
          
          if (!instance) {
            throw new Error(`Failed to reconnect instance ${instanceName}`);
          }
        } catch (reconnectError) {
          console.error(`❌ Erro ao reconectar instância ${instanceName}:`, reconnectError);
          throw new Error(`Instance exists but cannot be reconnected: ${reconnectError.message}`);
        }
      }
      
      if (instance.instance.status !== 'connected') {
        throw new Error(`Instance ${instanceName} is not connected (status: ${instance.instance.status})`);
      }

      // Buscar do WhatsApp
      const whatsappMessages = await evolutionApiService.getMessages(instanceName, limit);
      
      // Filtrar por contato se especificado
      let filteredMessages = whatsappMessages;
      if (contactId) {
        filteredMessages = whatsappMessages.filter(msg => 
          msg.from === contactId || msg.to === contactId
        );
      }

      // Enriquecer com dados do CRM
      const enrichedMessages = await this.enrichMessagesWithCRMData(filteredMessages, instanceName);
      
      // Salvar no cache
      this.cache.set(cacheKey, {
        data: enrichedMessages,
        timestamp: Date.now()
      });

      return enrichedMessages;
    } catch (error) {
      console.error(`Erro ao obter mensagens de ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Enriquecer contatos com dados do CRM
   */
  async enrichContactsWithCRMData(whatsappContacts, instanceName) {
    try {
      // Buscar relacionamentos no banco
      const { data: relationships } = await supabaseAdmin
        .from('whatsapp_contact_relationships')
        .select(`
          *,
          lead:leads(*),
          customer:customers(*)
        `)
        .eq('whatsapp_instance', instanceName);

      // Criar mapa de relacionamentos
      const relationshipMap = new Map();
      relationships?.forEach(rel => {
        relationshipMap.set(rel.whatsapp_contact_id, rel);
      });

      // Enriquecer contatos
      return whatsappContacts.map(contact => {
        const relationship = relationshipMap.get(contact.id);
        return {
          ...contact,
          // Dados do WhatsApp (originais)
          whatsapp_id: contact.id,
          whatsapp_name: contact.name,
          whatsapp_phone: contact.phone,
          whatsapp_is_group: contact.isGroup,
          whatsapp_is_wa_contact: contact.isWAContact,
          whatsapp_profile_pic: contact.profilePicUrl,
          whatsapp_status: contact.status,
          whatsapp_last_seen: contact.lastSeen,
          
          // Dados do CRM (enriquecidos)
          lead_id: relationship?.lead_id || null,
          customer_id: relationship?.customer_id || null,
          lead_name: relationship?.lead?.name || null,
          customer_name: relationship?.customer?.name || null,
          pipeline_status: relationship?.pipeline_status || null,
          crm_notes: relationship?.notes || null,
          
          // Dados computados
          display_name: relationship?.lead?.name || relationship?.customer?.name || contact.name,
          is_lead: !!relationship?.lead_id,
          is_customer: !!relationship?.customer_id,
          priority: relationship?.priority || 'normal'
        };
      });
    } catch (error) {
      console.error('Erro ao enriquecer contatos:', error);
      return whatsappContacts; // Retornar dados originais se falhar
    }
  }

  /**
   * Enriquecer mensagens com dados do CRM
   */
  async enrichMessagesWithCRMData(whatsappMessages, instanceName) {
    try {
      // Buscar mensagens salvas no banco
      const { data: savedMessages } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('whatsapp_instance', instanceName);

      // Criar mapa de mensagens salvas
      const savedMessagesMap = new Map();
      savedMessages?.forEach(msg => {
        savedMessagesMap.set(msg.whatsapp_message_id, msg);
      });

      // Enriquecer mensagens
      return whatsappMessages.map(msg => {
        const savedMsg = savedMessagesMap.get(msg.id);
        return {
          ...msg,
          // Dados do WhatsApp (originais)
          whatsapp_id: msg.id,
          whatsapp_from: msg.from,
          whatsapp_to: msg.to,
          whatsapp_body: msg.body,
          whatsapp_type: msg.type,
          whatsapp_timestamp: msg.timestamp,
          whatsapp_is_from_me: msg.isFromMe,
          
          // Dados do CRM (enriquecidos)
          conversation_id: savedMsg?.conversation_id || null,
          lead_id: savedMsg?.lead_id || null,
          customer_id: savedMsg?.customer_id || null,
          crm_notes: savedMsg?.notes || null,
          is_saved: !!savedMsg,
          
          // Dados computados
          display_body: msg.body,
          display_timestamp: new Date(msg.timestamp * 1000).toISOString(),
          sender_type: msg.isFromMe ? 'agent' : 'customer'
        };
      });
    } catch (error) {
      console.error('Erro ao enriquecer mensagens:', error);
      return whatsappMessages; // Retornar dados originais se falhar
    }
  }

  // ===== RELACIONAMENTOS CRM =====

  /**
   * Vincular contato do WhatsApp a um lead
   */
  async linkContactToLead(instanceName, whatsappContactId, leadId, notes = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_contact_relationships')
        .upsert({
          whatsapp_instance: instanceName,
          whatsapp_contact_id: whatsappContactId,
          lead_id: leadId,
          customer_id: null,
          pipeline_status: 'lead-bruto',
          notes: notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Limpar cache
      this.clearCache(`contacts_${instanceName}`);

      return data;
    } catch (error) {
      console.error('Erro ao vincular contato a lead:', error);
      throw error;
    }
  }

  /**
   * Vincular contato do WhatsApp a um cliente
   */
  async linkContactToCustomer(instanceName, whatsappContactId, customerId, notes = null) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_contact_relationships')
        .upsert({
          whatsapp_instance: instanceName,
          whatsapp_contact_id: whatsappContactId,
          lead_id: null,
          customer_id: customerId,
          pipeline_status: 'cliente',
          notes: notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Limpar cache
      this.clearCache(`contacts_${instanceName}`);

      return data;
    } catch (error) {
      console.error('Erro ao vincular contato a cliente:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do pipeline de um contato
   */
  async updateContactPipelineStatus(instanceName, whatsappContactId, pipelineStatus) {
    try {
      const { data, error } = await supabaseAdmin
        .from('whatsapp_contact_relationships')
        .update({
          pipeline_status: pipelineStatus,
          updated_at: new Date().toISOString()
        })
        .eq('whatsapp_instance', instanceName)
        .eq('whatsapp_contact_id', whatsappContactId)
        .select()
        .single();

      if (error) throw error;

      // Limpar cache
      this.clearCache(`contacts_${instanceName}`);

      return data;
    } catch (error) {
      console.error('Erro ao atualizar status do pipeline:', error);
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

  // ===== UTILIDADES E DEBUG =====

  /**
   * Verificar status de uma instância
   */
  async getInstanceStatus(instanceName) {
    try {
      // Verificar se está ativa no serviço
      const activeInstances = evolutionApiService.getInstances();
      const activeInstance = activeInstances.find(inst => inst.instance.instanceName === instanceName);
      
      // Verificar se está no banco
      const { data: dbInstance, error: dbError } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      return {
        instanceName,
        activeInService: !!activeInstance,
        activeStatus: activeInstance?.instance?.status || 'not_found',
        inDatabase: !dbError && !!dbInstance,
        dbStatus: dbInstance?.status || 'not_found',
        dbPhoneNumber: dbInstance?.phone_number || null,
        canReconnect: !dbError && dbInstance && dbInstance.status === 'connected',
        lastActivity: activeInstance?.instance?.lastActivity || dbInstance?.updated_at || null
      };
    } catch (error) {
      console.error(`Erro ao verificar status da instância ${instanceName}:`, error);
      return {
        instanceName,
        error: error.message,
        activeInService: false,
        activeStatus: 'error',
        inDatabase: false,
        dbStatus: 'error',
        canReconnect: false
      };
    }
  }

  /**
   * Listar status de todas as instâncias
   */
  async getAllInstancesStatus() {
    try {
      // Buscar todas as instâncias do banco
      const { data: dbInstances, error: dbError } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      // Verificar status de cada instância
      const statusPromises = dbInstances.map(instance => 
        this.getInstanceStatus(instance.instance_name)
      );

      const statuses = await Promise.all(statusPromises);

      return {
        total: statuses.length,
        instances: statuses,
        cacheStats: this.getCacheStats()
      };
    } catch (error) {
      console.error('Erro ao listar status das instâncias:', error);
      throw error;
    }
  }

  // ===== COMPATIBILIDADE COM API EXISTENTE =====

  /**
   * Obter conversas no formato atual (para compatibilidade)
   */
  async getConversationsForInstance(instanceName) {
    try {
      const contacts = await this.getContacts(instanceName);
      
      // Converter para formato de conversas
      return contacts
        .filter(contact => contact.is_lead || contact.is_customer)
        .map(contact => ({
          id: contact.whatsapp_id,
          customer_id: contact.customer_id,
          lead_id: contact.lead_id,
          whatsapp_instance: instanceName,
          whatsapp_number: contact.whatsapp_phone,
          status: 'open',
          pipeline_status: contact.pipeline_status || 'lead-bruto',
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Campos da view conversations_with_lead
          lead_name: contact.lead_name,
          lead_email: contact.lead?.email,
          lead_phone: contact.lead?.phone,
          lead_status: contact.lead?.status,
          customer_name: contact.customer_name,
          customer_whatsapp: contact.whatsapp_phone
        }));
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      return [];
    }
  }

  /**
   * Obter mensagens no formato atual (para compatibilidade)
   */
  async getMessagesForConversation(conversationId, instanceName) {
    try {
      const messages = await this.getMessages(instanceName, conversationId);
      
      // Converter para formato atual
      return messages.map(msg => ({
        id: msg.whatsapp_id,
        conversation_id: msg.conversation_id || conversationId,
        whatsapp_message_id: msg.whatsapp_id,
        sender_type: msg.sender_type,
        content: msg.whatsapp_body,
        message_type: msg.whatsapp_type || 'text',
        media_url: null,
        is_read: true,
        created_at: msg.display_timestamp
      }));
    } catch (error) {
      console.error('Erro ao obter mensagens da conversa:', error);
      return [];
    }
  }
}

module.exports = new WhatsAppCompatibilityService(); 