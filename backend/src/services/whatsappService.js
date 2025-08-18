const { supabase, supabaseAdmin } = require('./supabase');
const evolutionApiService = require('./evolutionApi');

class WhatsAppService {
  constructor() {
    this.cache = new Map();
  }

  // ===== GESTÃO DE INSTÂNCIAS =====
  
  async getInstances() {
    try {
      const activeInstances = evolutionApiService.getInstances();
      const { data: dbInstances, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar instâncias do banco:', error);
        // Retornar estrutura flat mesmo se houver erro no banco
        return activeInstances.map(activeInst => ({
          instance_name: activeInst.instance.instanceName,
          status: activeInst.instance.status,
          phone_number: activeInst.instance.phone_number,
          qr_code: activeInst.instance.qrcode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      }

      // Combinar dados do Evolution API com dados do banco
      const combinedInstances = activeInstances.map(activeInst => {
        const dbInstance = dbInstances.find(db => db.instance_name === activeInst.instance.instanceName);
        
        // Retornar estrutura flat compatível com o frontend
        return {
          instance_name: activeInst.instance.instanceName,
          status: dbInstance?.status || activeInst.instance.status,
          phone_number: dbInstance?.phone_number || activeInst.instance.phone_number,
          qr_code: activeInst.instance.qrcode,
          created_at: dbInstance?.created_at || new Date().toISOString(),
          updated_at: dbInstance?.updated_at || new Date().toISOString()
        };
      });

      return combinedInstances;
    } catch (error) {
      console.error('❌ Erro ao obter instâncias:', error);
      return [];
    }
  }

  async updateInstanceStatus(instanceName, status, phoneNumber = null) {
    try {
      const updateData = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (phoneNumber) {
        updateData.phone_number = phoneNumber;
      }

      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .upsert({
          instance_name: instanceName,
          ...updateData
        });

      if (error) {
        console.error('❌ Erro ao atualizar status da instância:', error);
        return false;
      }

      console.log(`✅ Status atualizado para ${instanceName}: ${status}${phoneNumber ? ` (${phoneNumber})` : ''}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar status da instância:', error);
      return false;
    }
  }

  // ===== CONTATOS =====

  async syncContacts(instanceName, forceRefresh = false) {
    try {
      console.log(`🔄 Sincronizando contatos da instância ${instanceName}...`);
      
      // Verificar cache primeiro
      const cacheStatus = evolutionApiService.getCacheStatus(instanceName);
      console.log(`📊 Status do cache: ${cacheStatus.hasCache ? 'Disponível' : 'Não disponível'}, ${cacheStatus.isExpired ? 'Expirado' : 'Válido'}`);
      
      let whatsappContacts;
      
      if (forceRefresh || !cacheStatus.hasCache || cacheStatus.isExpired) {
        console.log(`🔄 Buscando contatos da Evolution API...`);
        whatsappContacts = await evolutionApiService.getContacts(instanceName);
      } else {
        console.log(`✅ Usando contatos do cache (${cacheStatus.contactsCount} contatos)`);
        whatsappContacts = evolutionApiService.contactsCache.get(instanceName);
      }
      
      // Preparar dados para inserção/atualização com campos completos
      const contactsToUpsert = whatsappContacts.map(contact => {
        // Função para determinar tipo de ID
        const getPhoneType = (phone) => {
          if (!phone) return 'unknown';
          if (phone.includes('@g.us')) return 'group';
          if (phone.includes('@c.us') || phone.includes('@s.whatsapp.net')) return 'contact';
          return 'unknown';
        };
        
        // Função para extrair número limpo (apenas para contatos)
        const extractCleanPhone = (phone) => {
          if (!phone) return null;
          if (phone.includes('@g.us')) return null; // Grupos não têm número limpo
          return phone.replace('@c.us', '').replace('@s.whatsapp.net', '');
        };
        
        const phoneType = getPhoneType(contact.phone);
        const cleanPhone = extractCleanPhone(contact.phone);
        const isGroup = phoneType === 'group';
        
        // Para grupos, usar o ID original como ID do banco
        // Para contatos, usar o número limpo como ID
        const contactId = isGroup ? contact.phone : (cleanPhone || contact.phone);
        
        return {
          id: contactId,
          instance_name: instanceName,
          phone: contact.phone, // Salvar o ID original/cru
          original_id: contact.phone, // Backup do ID original
          id_type: phoneType,
          is_group: isGroup,
          name: contact.name || (isGroup ? contact.phone : (cleanPhone || contact.phone)), // Nome real ou número como fallback
          display_name: contact.pushName || contact.name || (isGroup ? contact.phone : (cleanPhone || contact.phone)), // Nome de exibição
          push_name: contact.pushName,
          formatted_name: contact.formattedName || contact.name || (isGroup ? contact.phone : (cleanPhone || contact.phone)),
          short_name: contact.shortName || (contact.name ? contact.name.split(' ')[0] : (isGroup ? contact.phone : (cleanPhone || contact.phone))),
          profile_pic_url: contact.profilePicUrl,
          status: contact.status,
          last_seen: contact.lastSeen,
          is_group: contact.isGroup,
          is_wa_contact: contact.isWAContact,
          is_business: contact.isBusiness || false,
          is_verified: contact.isVerified || false,
          is_my_contact: contact.isMyContact || false,
          business_profile: contact.businessProfile || null,
          verified_name: contact.verifiedName,
          labels: contact.labels || [],
          has_messages: false, // Será atualizado quando sincronizar mensagens
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      console.log(`📊 Contatos para sincronização: ${contactsToUpsert.length}`);

      // Fazer upsert dos contatos
      const { data: syncedContacts, error } = await supabaseAdmin
        .from('whatsapp_contacts')
        .upsert(contactsToUpsert, { 
          onConflict: 'id,instance_name',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao sincronizar contatos:', error);
        throw error;
      }

      console.log(`✅ ${syncedContacts.length} contatos sincronizados`);
      
      // Log de estatísticas
      const withPhotos = syncedContacts.filter(c => c.profile_pic_url).length;
      const withNames = syncedContacts.filter(c => c.display_name && c.display_name !== c.phone).length;
      const businessContacts = syncedContacts.filter(c => c.is_business).length;
      
      console.log(`📊 Estatísticas: ${withPhotos} com foto, ${withNames} com nome, ${businessContacts} business`);
      
      return syncedContacts;
    } catch (error) {
      console.error('❌ Erro na sincronização de contatos:', error);
      throw error;
    }
  }

  async getContacts(instanceName, forceRefresh = false) {
    try {
      console.log(`📱 Buscando contatos da instância ${instanceName}...`);

      const { data: contacts, error } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('*')
        .eq('instance_name', instanceName)
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar contatos:', error);
        throw error;
      }

      console.log(`✅ ${contacts.length} contatos encontrados`);
      return contacts;
    } catch (error) {
      console.error('❌ Erro ao obter contatos:', error);
      throw error;
    }
  }

  // ===== MENSAGENS =====

  async syncMessages(instanceName, limit = 100) {
    try {
      console.log(`🔄 Sincronizando mensagens da instância ${instanceName}...`);

      const activeInstances = evolutionApiService.getInstances();
      const activeRecord = activeInstances.find(inst => inst.instance?.instanceName === instanceName);
      const status = activeRecord?.instance?.status;
      
      if (!status || status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      const whatsappMessages = await evolutionApiService.getMessages(instanceName, limit);
      
      if (!whatsappMessages || whatsappMessages.length === 0) {
        console.log('⚠️ Nenhuma mensagem encontrada no WhatsApp');
        return [];
      }

      // Função para limpar ID do WhatsApp (remover @c.us)
      const cleanWhatsAppId = (id) => {
        if (!id) return null;
        return id.replace('@c.us', '').replace('@s.whatsapp.net', '');
      };

      const messagesToUpsert = whatsappMessages.map(msg => {
        // Usar os campos já processados pela Evolution API
        const cleanFromId = msg.cleanFrom || cleanWhatsAppId(msg.from);
        const cleanToId = msg.cleanTo || cleanWhatsAppId(msg.to);
        
        return {
          id: msg.id,
          from_id: cleanFromId,
          to_id: cleanToId,
          body: msg.body,
          type: msg.type || 'chat',
          timestamp: msg.timestamp, // Já corrigido pela Evolution API
          is_from_me: msg.isFromMe || false,
          media_url: msg.mediaUrl,
          media_type: msg.mediaType,
          media_filename: msg.mediaFilename,
          status: msg.status || 'sent',
          instance_name: instanceName,
          conversation_id: msg.conversationId, // Novo campo para agrupamento
          updated_at: new Date().toISOString()
        };
      });

      // Verificar se todos os contatos existem antes de inserir mensagens
      const allContactIds = new Set();
      messagesToUpsert.forEach(msg => {
        if (msg.from_id) allContactIds.add(msg.from_id);
        if (msg.to_id) allContactIds.add(msg.to_id);
      });

      // Buscar contatos existentes
      const { data: existingContacts, error: contactsError } = await supabaseAdmin
        .from('whatsapp_contacts')
        .select('id')
        .in('id', Array.from(allContactIds))
        .eq('instance_name', instanceName);

      if (contactsError) {
        console.error('❌ Erro ao verificar contatos existentes:', contactsError);
        throw contactsError;
      }

      const existingContactIds = new Set(existingContacts.map(c => c.id));
      const missingContactIds = Array.from(allContactIds).filter(id => !existingContactIds.has(id));

      // Criar contatos faltantes
      if (missingContactIds.length > 0) {
        console.log(`📝 Criando ${missingContactIds.length} contatos faltantes...`);
        
        const contactsToInsert = missingContactIds
          .map(id => {
            // Função para determinar tipo de ID
            const getPhoneType = (id) => {
              if (!id) return 'unknown';
              if (id.includes('@g.us')) return 'group';
              if (id.includes('@c.us') || id.includes('@s.whatsapp.net')) return 'contact';
              return 'unknown';
            };
            
            // Função para extrair número limpo (apenas para contatos)
            const extractCleanPhone = (id) => {
              if (!id) return null;
              if (id.includes('@g.us')) return null; // Grupos não têm número limpo
              return id.replace('@c.us', '').replace('@s.whatsapp.net', '');
            };
            
            const phoneType = getPhoneType(id);
            const cleanPhone = extractCleanPhone(id);
            const isGroup = phoneType === 'group';
            
            // Para grupos, usar o ID original como ID do banco
            // Para contatos, usar o número limpo como ID
            const contactId = isGroup ? id : (cleanPhone || id);
            
            return {
              id: contactId,
              instance_name: instanceName,
              phone: id, // Salvar o ID original/cru
              original_id: id, // Backup do ID original
              id_type: phoneType,
              is_group: isGroup,
              name: isGroup ? id : (cleanPhone || id), // Nome inicial
              has_messages: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });

        const { error: insertContactsError } = await supabaseAdmin
          .from('whatsapp_contacts')
          .insert(contactsToInsert);

        if (insertContactsError) {
          console.error('❌ Erro ao criar contatos faltantes:', insertContactsError);
          throw insertContactsError;
        }

        console.log(`✅ ${contactsToInsert.length} contatos criados`);
      }

      // Agora inserir as mensagens
      const { data: syncedMessages, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .upsert(messagesToUpsert, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao sincronizar mensagens:', error);
        throw error;
      }

      console.log(`✅ ${syncedMessages.length} mensagens sincronizadas`);
      return syncedMessages;
    } catch (error) {
      console.error('❌ Erro na sincronização de mensagens:', error);
      throw error;
    }
  }

  async getConversationMessages(contactId, instanceName, limit = 50) {
    try {
      console.log(`💬 Buscando mensagens da conversa ${contactId}...`);
 
      // Preparar variações do ID (com e sem sufixo @c.us)
      const hasJid = contactId.includes('@');
      const jid = hasJid ? contactId : `${contactId}@c.us`;
      const plain = hasJid ? contactId.replace('@c.us', '') : contactId;

      // Buscar mensagens usando múltiplas variações para máxima compatibilidade
      const { data: messages, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .select('*')
        .eq('instance_name', instanceName)
        .or(
          [
            `from_id.eq.${jid}`,
            `to_id.eq.${jid}`,
            `from_id.eq.${plain}`,
            `to_id.eq.${plain}`
          ].join(',')
        )
        .order('timestamp', { ascending: true })
        .limit(limit);
 
      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw error;
      }
 
      console.log(`✅ ${messages.length} mensagens encontradas para conversa ${contactId}`);
      return messages;
    } catch (error) {
      console.error('❌ Erro ao obter mensagens da conversa:', error);
      throw error;
    }
  }

  // ===== CONVERSAS =====

  async getConversations(instanceName, forceRefresh = false) {
    try {
      console.log(`📱 Buscando conversas da instância ${instanceName}...`);

      // Buscar conversas com dados completos dos contatos
      const { data: conversations, error } = await supabaseAdmin
        .from('whatsapp_messages')
        .select(`
          from_id,
          to_id,
          body,
          timestamp,
          is_from_me,
          instance_name,
          from_contact:whatsapp_contacts!whatsapp_messages_from_id_fkey(
            id,
            name,
            phone,
            display_name,
            formatted_name,
            short_name,
            profile_pic_url,
            status,
            last_seen,
            is_group,
            is_wa_contact,
            is_business,
            is_verified
          ),
          to_contact:whatsapp_contacts!whatsapp_messages_to_id_fkey(
            id,
            name,
            phone,
            display_name,
            formatted_name,
            short_name,
            profile_pic_url,
            status,
            last_seen,
            is_group,
            is_wa_contact,
            is_business,
            is_verified
          )
        `)
        .eq('instance_name', instanceName)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      // Agrupar mensagens por contato e criar conversas
      const conversationMap = new Map();
      
      conversations.forEach(msg => {
        // Identificar o contato correto (não a instância)
        const contactId = msg.is_from_me ? msg.to_id : msg.from_id;
        const contact = msg.is_from_me ? msg.to_contact : msg.from_contact;
        
        // Função para limpar ID do WhatsApp
        const cleanWhatsAppId = (id) => {
          if (!id) return null;
          if (id.includes('@c.us')) {
            return id.replace('@c.us', '');
          }
          return id;
        };
        
        // Limpar o ID do contato para agrupamento consistente
        const cleanContactId = cleanWhatsAppId(contactId);
        
        // Usar display_name como prioridade, depois formatted_name, depois name, depois phone limpo
        const contactName = contact?.display_name || contact?.formatted_name || contact?.name || cleanContactId;
        const contactPhone = contact?.phone || contactId;
        const contactAvatar = contact?.profile_pic_url;
        const contactStatus = contact?.status;
        const isBusiness = contact?.is_business || false;
        const isVerified = contact?.is_verified || false;
        
        if (!conversationMap.has(cleanContactId)) {
          conversationMap.set(cleanContactId, {
            contact_id: cleanContactId,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_avatar: contactAvatar,
            contact_status: contactStatus,
            contact_is_business: isBusiness,
            contact_is_verified: isVerified,
            last_message_body: msg.body || 'Mensagem de mídia',
            last_message_timestamp: msg.timestamp,
            message_count: 1,
            instance_name: instanceName
          });
        } else {
          const conv = conversationMap.get(cleanContactId);
          conv.message_count++;
          // Atualizar última mensagem se for mais recente
          if (msg.timestamp > conv.last_message_timestamp) {
            conv.last_message_body = msg.body || 'Mensagem de mídia';
            conv.last_message_timestamp = msg.timestamp;
          }
        }
      });

      const formattedConversations = Array.from(conversationMap.values())
        .filter(conv => conv.message_count > 0)
        .sort((a, b) => b.last_message_timestamp - a.last_message_timestamp);

      console.log(`✅ ${formattedConversations.length} conversas encontradas`);
      return formattedConversations;
    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error);
      throw error;
    }
  }

  // ===== ENVIO DE MENSAGENS =====

  async sendMessage(instanceName, number, text, clientMessageId) {
    try {
      console.log(`✉️ Enviando mensagem via serviço: ${instanceName} -> ${number}`);
      
      // Enviar via Evolution API
      const result = await evolutionApiService.sendMessage(instanceName, number, text);
      
      // Persistir imediatamente no banco para refletir no frontend
      const messageId = result.messageId || clientMessageId || `${instanceName}_${Date.now()}`;
      const toId = result.chatId || number;
      const fromId = (evolutionApiService.instances.get(instanceName)?.info?.wid?._serialized) || instanceName;
      
      const { error: insertErr } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          id: messageId,
          instance_name: instanceName,
          from_id: fromId,
          to_id: toId.replace('@c.us', ''),
          body: text,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'text',
          is_from_me: true,
          status: 'sent',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      if (insertErr) {
        console.warn('⚠️ Falha ao persistir mensagem enviada (seguindo sem bloquear):', insertErr.message);
      } else {
        try {
          const events = require('./events');
          events.publish(instanceName, toId, {
            kind: 'message',
            direction: 'outbound',
            id: messageId,
            body: text,
            timestamp: Math.floor(Date.now() / 1000),
            is_from_me: true,
            status: 'sent'
          });
        } catch {}
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro no serviço ao enviar mensagem:', error);
      throw error;
    }
  }

  // ===== RELACIONAMENTOS CRM =====

  async linkContactToLead(contactId, leadId, notes = null) {
    try {
      console.log(`🔗 Vinculando contato ${contactId} ao lead ${leadId}...`);

      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .upsert({
          whatsapp_contact_id: contactId,
          lead_id: leadId,
          notes: notes,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'whatsapp_contact_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao vincular contato ao lead:', error);
        throw error;
      }

      console.log('✅ Contato vinculado ao lead com sucesso');
      return data[0];
    } catch (error) {
      console.error('❌ Erro ao vincular contato ao lead:', error);
      throw error;
    }
  }

  async updatePipelineStatus(contactId, pipelineStatus) {
    try {
      console.log(`📊 Atualizando status do pipeline para ${contactId}: ${pipelineStatus}`);

      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .update({
          pipeline_status: pipelineStatus,
          updated_at: new Date().toISOString()
        })
        .eq('whatsapp_contact_id', contactId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar status do pipeline:', error);
        throw error;
      }

      console.log('✅ Status do pipeline atualizado com sucesso');
      return data[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar status do pipeline:', error);
      throw error;
    }
  }

  // ===== MÉTODOS ADICIONAIS =====

  async getConversationsWithCRM(instanceName) {
    try {
      console.log(`📱 Obtendo conversas com CRM da instância ${instanceName}...`);

      const { data: conversations, error } = await supabaseAdmin
        .from('whatsapp_conversations_with_crm')
        .select('*')
        .eq('instance_name', instanceName)
        .order('last_message_timestamp', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar conversas com CRM:', error);
        throw error;
      }

      console.log(`✅ ${conversations.length} conversas com CRM encontradas`);
      return conversations;
    } catch (error) {
      console.error('❌ Erro ao obter conversas com CRM:', error);
      throw error;
    }
  }

  async linkContactToCustomer(contactId, customerId, notes = null) {
    try {
      console.log(`🔗 Vinculando contato ${contactId} ao cliente ${customerId}...`);

      const { data, error } = await supabaseAdmin
        .from('whatsapp_crm_relationships')
        .upsert({
          whatsapp_contact_id: contactId,
          customer_id: customerId,
          notes: notes,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'whatsapp_contact_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Erro ao vincular contato ao cliente:', error);
        throw error;
      }

      console.log('✅ Contato vinculado ao cliente com sucesso');
      return data[0];
    } catch (error) {
      console.error('❌ Erro ao vincular contato ao cliente:', error);
      throw error;
    }
  }

  async getInstanceStats(instanceName) {
    try {
      console.log(`📊 Obtendo estatísticas da instância ${instanceName}...`);

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
        .eq('has_messages', true);

      const stats = {
        contacts: contactsCount || 0,
        messages: messagesCount || 0,
        conversations: conversationsCount || 0,
        last_sync: new Date().toISOString()
      };

      console.log('✅ Estatísticas obtidas com sucesso');
      return stats;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      console.log('✅ Cache limpo completamente');
    } else {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`✅ ${keysToDelete.length} itens removidos do cache`);
    }
  }
}

module.exports = new WhatsAppService(); 