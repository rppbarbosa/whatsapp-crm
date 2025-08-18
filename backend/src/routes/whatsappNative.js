const express = require('express');
const router = express.Router();
const evolutionApiService = require('../services/evolutionApi');
const whatsappNativeService = require('../services/whatsappNativeService');
const { supabase, supabaseAdmin } = require('../services/supabase');

// Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers.apikey || req.headers['x-api-key'];
  const expectedKey = process.env.EVOLUTION_API_KEY || 'test';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid API key' 
    });
  }
  
  next();
};

// ===== ENDPOINTS NATIVOS =====

// Sincronizar contatos de uma instância
router.post('/instances/:instanceName/sync-contacts', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`🔄 Iniciando sincronização de contatos para instância: ${instanceName}`);
    
    // Verificar se a instância está conectada
    const activeInstances = evolutionApiService.getInstances();
    const instance = activeInstances.find(inst => inst.instance.instanceName === instanceName);
    
    if (!instance || instance.instance.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instance is not connected' 
      });
    }
    
    // Buscar contatos do WhatsApp
    const whatsappContacts = await evolutionApiService.getContacts(instanceName);
    
    // Sincronizar com o banco
    const syncedContacts = await whatsappNativeService.syncContacts(instanceName, whatsappContacts);
    
    console.log(`✅ Sincronização concluída: ${syncedContacts.length} contatos`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      contacts_synced: syncedContacts.length,
      data: syncedContacts
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização de contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Sincronizar mensagens de uma instância
router.post('/instances/:instanceName/sync-messages', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { limit = 100 } = req.query;
    
    console.log(`🔄 Iniciando sincronização de mensagens para instância: ${instanceName}`);
    
    // Verificar se a instância está conectada
    const activeInstances = evolutionApiService.getInstances();
    const instance = activeInstances.find(inst => inst.instance.instanceName === instanceName);
    
    if (!instance || instance.instance.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instance is not connected' 
      });
    }
    
    // Buscar mensagens do WhatsApp
    const whatsappMessages = await evolutionApiService.getMessages(instanceName, parseInt(limit));
    
    // Sincronizar com o banco
    const syncedMessages = await whatsappNativeService.syncMessages(instanceName, whatsappMessages);
    
    console.log(`✅ Sincronização concluída: ${syncedMessages.length} mensagens`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      messages_synced: syncedMessages.length,
      data: syncedMessages
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização de mensagens:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Obter conversas de uma instância
router.get('/instances/:instanceName/conversations', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { forceRefresh = false } = req.query;
    
    console.log(`📱 Obtendo conversas da instância: ${instanceName}`);
    
    const conversations = await whatsappNativeService.getConversations(
      instanceName, 
      forceRefresh === 'true'
    );
    
    console.log(`✅ ${conversations.length} conversas encontradas`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      conversations_count: conversations.length,
      data: conversations
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter conversas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Obter conversas com dados do CRM
router.get('/instances/:instanceName/conversations-with-crm', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`📱 Obtendo conversas com CRM da instância: ${instanceName}`);
    
    const conversations = await whatsappNativeService.getConversationsWithCRM(instanceName);
    
    console.log(`✅ ${conversations.length} conversas com CRM encontradas`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      conversations_count: conversations.length,
      data: conversations
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter conversas com CRM:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Obter mensagens de uma conversa
router.get('/conversations/:contactId/messages', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { instance: instanceName, limit = 50 } = req.query;
    
    if (!instanceName) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instance parameter is required' 
      });
    }
    
    console.log(`💬 Obtendo mensagens da conversa: ${contactId} (instância: ${instanceName})`);
    
    const messages = await whatsappNativeService.getConversationMessages(
      contactId, 
      instanceName, 
      parseInt(limit)
    );
    
    console.log(`✅ ${messages.length} mensagens encontradas`);
    
    res.json({
      success: true,
      contact_id: contactId,
      instance_name: instanceName,
      messages_count: messages.length,
      data: messages
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter mensagens da conversa:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Obter contatos de uma instância
router.get('/instances/:instanceName/contacts', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { forceRefresh = false } = req.query;
    
    console.log(`📱 Obtendo contatos da instância: ${instanceName}`);
    
    const contacts = await whatsappNativeService.getContacts(
      instanceName, 
      forceRefresh === 'true'
    );
    
    console.log(`✅ ${contacts.length} contatos encontrados`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      contacts_count: contacts.length,
      data: contacts
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== RELACIONAMENTOS CRM =====

// Vincular contato a um lead
router.post('/contacts/:contactId/link-lead', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { leadId, notes } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'leadId is required' 
      });
    }
    
    console.log(`🔗 Vinculando contato ${contactId} a lead ${leadId}`);
    
    const relationship = await whatsappNativeService.linkContactToLead(contactId, leadId, notes);
    
    console.log(`✅ Contato vinculado com sucesso`);
    
    res.json({
      success: true,
      relationship: relationship
    });
    
  } catch (error) {
    console.error('❌ Erro ao vincular contato a lead:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Vincular contato a um cliente
router.post('/contacts/:contactId/link-customer', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { customerId, notes } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'customerId is required' 
      });
    }
    
    console.log(`🔗 Vinculando contato ${contactId} a cliente ${customerId}`);
    
    const relationship = await whatsappNativeService.linkContactToCustomer(contactId, customerId, notes);
    
    console.log(`✅ Contato vinculado com sucesso`);
    
    res.json({
      success: true,
      relationship: relationship
    });
    
  } catch (error) {
    console.error('❌ Erro ao vincular contato a cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Atualizar status do pipeline
router.put('/contacts/:contactId/pipeline-status', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { pipelineStatus } = req.body;
    
    if (!pipelineStatus) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'pipelineStatus is required' 
      });
    }
    
    console.log(`📊 Atualizando status do pipeline para ${pipelineStatus} no contato ${contactId}`);
    
    const relationship = await whatsappNativeService.updatePipelineStatus(contactId, pipelineStatus);
    
    console.log(`✅ Status do pipeline atualizado com sucesso`);
    
    res.json({
      success: true,
      relationship: relationship
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status do pipeline:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas da instância
router.get('/instances/:instanceName/stats', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`📊 Obtendo estatísticas da instância: ${instanceName}`);
    
    const stats = await whatsappNativeService.getInstanceStats(instanceName);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Obter estatísticas de cache
router.get('/cache/stats', authenticateApiKey, async (req, res) => {
  try {
    const stats = whatsappNativeService.getCacheStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de cache:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// Limpar cache
router.post('/cache/clear', authenticateApiKey, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      whatsappNativeService.clearCache(pattern);
      console.log(`🧹 Cache limpo para padrão: ${pattern}`);
    } else {
      whatsappNativeService.clearAllCache();
      console.log(`🧹 Todo o cache foi limpo`);
    }
    
    res.json({ 
      success: true,
      message: 'Cache cleared successfully',
      pattern: pattern || 'all'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

module.exports = router; 