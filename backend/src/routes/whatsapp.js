const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const evolutionApiService = require('../services/evolutionApi');

// Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers.apikey || req.headers['x-api-key'];
  const expectedKey = process.env.EVOLUTION_API_KEY || 'test';
  
  console.log('🔐 Autenticação:', {
    receivedKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
    expectedKey: expectedKey ? `${expectedKey.substring(0, 10)}...` : 'none',
    method: req.method,
    url: req.url
  });
  
  if (!apiKey || apiKey !== expectedKey) {
    console.log('❌ Autenticação falhou');
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid API key' 
    });
  }
  
  console.log('✅ Autenticação bem-sucedida');
  next();
};

// ===== GESTÃO DE INSTÂNCIAS =====

// GET /api/whatsapp/instances - Listar todas as instâncias
router.get('/instances', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Listando instâncias do WhatsApp...');
    
    const instances = await whatsappService.getInstances();
    
    console.log(`✅ ${instances.length} instâncias encontradas`);
    
    res.json({
      success: true,
      instances_count: instances.length,
      data: instances
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instances - Criar nova instância
router.post('/instances', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName, webhookUrl } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'instanceName is required' 
      });
    }
    
    console.log(`📱 Criando instância: ${instanceName}`);
    
    // Criar instância via Evolution API
    const result = await evolutionApiService.createInstance(instanceName, webhookUrl);
    
    console.log('✅ Instância criada com sucesso');
    
    res.json({
      success: true,
      instance_name: instanceName,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/instances/:instanceName/connect - Conectar instância
router.get('/instances/:instanceName/connect', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`🔗 Conectando instância: ${instanceName}`);
    
    // Conectar instância via Evolution API
    const result = await evolutionApiService.connectInstance(instanceName);
    
    console.log('✅ Instância conectada com sucesso');
    
    res.json({
      success: true,
      instance_name: instanceName,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao conectar instância:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/instances/:instanceName/qr-code - Obter QR code
router.get('/instances/:instanceName/qr-code', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`📱 Obtendo QR code da instância: ${instanceName}`);
    
    // Obter QR code via Evolution API
    const result = await evolutionApiService.getQRCode(instanceName);
    
    console.log('✅ QR code obtido com sucesso');
    
    res.json({
      success: true,
      instance_name: instanceName,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter QR code:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// DELETE /api/whatsapp/instances/:instanceName - Deletar instância
router.delete('/instances/:instanceName', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    // Validar se o instanceName é válido
    if (!instanceName || instanceName === 'undefined' || instanceName.trim() === '') {
      console.error('❌ Instance name inválido:', instanceName);
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instance name is required and cannot be undefined' 
      });
    }
    
    console.log(`🗑️ Deletando instância: ${instanceName}`);
    
    // Primeiro, deletar do banco de dados
    const { supabaseAdmin } = require('../services/supabase');
    const { error: dbError } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('instance_name', instanceName);
    
    if (dbError) {
      console.error('❌ Erro ao deletar instância do banco:', dbError);
      return res.status(500).json({ 
        error: 'Database Error', 
        message: 'Failed to delete instance from database' 
      });
    }
    
    // Depois, tentar deletar da memória (Evolution API)
    try {
      const result = await evolutionApiService.deleteInstance(instanceName);
      console.log('✅ Instância deletada da memória');
    } catch (memoryError) {
      console.warn('⚠️ Erro ao deletar da memória (pode não existir):', memoryError.message);
      // Não falhar se não existir na memória
    }
    
    console.log('✅ Instância deletada com sucesso');
    
    res.json({
      success: true,
      instance_name: instanceName,
      message: 'Instance deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== SINCRONIZAÇÃO =====

// POST /api/whatsapp/instances/:instanceName/sync-contacts - Sincronizar contatos
router.post('/instances/:instanceName/sync-contacts', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { forceRefresh = false } = req.query;
    
    console.log(`🔄 Sincronizando contatos da instância ${instanceName}...`);
    
    const syncedContacts = await whatsappService.syncContacts(instanceName, forceRefresh === 'true');
    
    console.log(`✅ ${syncedContacts.length} contatos sincronizados`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      contacts_synced: syncedContacts.length,
      force_refresh: forceRefresh === 'true',
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

// POST /api/whatsapp/instances/:instanceName/refresh-contacts - Forçar atualização do cache
router.post('/instances/:instanceName/refresh-contacts', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`🔄 Forçando atualização do cache de contatos para ${instanceName}...`);
    
    const refreshedContacts = await evolutionApiService.forceRefreshContacts(instanceName);
    
    console.log(`✅ Cache atualizado com ${refreshedContacts.length} contatos`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      contacts_count: refreshedContacts.length,
      cache_updated: true,
      data: refreshedContacts
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cache de contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/instances/:instanceName/cache-status - Status do cache
router.get('/instances/:instanceName/cache-status', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    const cacheStatus = evolutionApiService.getCacheStatus(instanceName);
    
    res.json({
      success: true,
      instance_name: instanceName,
      cache_status: cacheStatus
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter status do cache:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instances/:instanceName/sync-messages - Sincronizar mensagens
router.post('/instances/:instanceName/sync-messages', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { limit = 100 } = req.query;
    
    console.log(`🔄 Sincronizando mensagens da instância ${instanceName}...`);
    
    const syncedMessages = await whatsappService.syncMessages(instanceName, parseInt(limit));
    
    console.log(`✅ ${syncedMessages.length} mensagens sincronizadas`);
    
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

// ===== CONTATOS =====

// GET /api/whatsapp/instances/:instanceName/contacts - Listar contatos
router.get('/instances/:instanceName/contacts', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { forceRefresh = false } = req.query;
    
    console.log(`📱 Listando contatos da instância ${instanceName}...`);
    
    const contacts = await whatsappService.getContacts(instanceName, forceRefresh === 'true');
    
    console.log(`✅ ${contacts.length} contatos encontrados`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      contacts_count: contacts.length,
      data: contacts
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar contatos:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== CONVERSAS =====

// GET /api/whatsapp/instances/:instanceName/conversations - Listar conversas
router.get('/instances/:instanceName/conversations', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { forceRefresh = false } = req.query;
    
    console.log(`📱 Listando conversas da instância ${instanceName}...`);
    
    const conversations = await whatsappService.getConversations(instanceName, forceRefresh === 'true');
    
    console.log(`✅ ${conversations.length} conversas encontradas`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      conversations_count: conversations.length,
      data: conversations
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar conversas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/instances/:instanceName/conversations-with-crm - Listar conversas com CRM
router.get('/instances/:instanceName/conversations-with-crm', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`📱 Listando conversas com CRM da instância ${instanceName}...`);
    
    const conversations = await whatsappService.getConversationsWithCRM(instanceName);
    
    console.log(`✅ ${conversations.length} conversas com CRM encontradas`);
    
    res.json({
      success: true,
      instance_name: instanceName,
      conversations_count: conversations.length,
      data: conversations
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar conversas com CRM:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== MENSAGENS =====

// GET /api/whatsapp/conversations/:contactId/messages - Obter mensagens de uma conversa
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
    
    console.log(`💬 Obtendo mensagens da conversa ${contactId}...`);
    
    const messages = await whatsappService.getConversationMessages(contactId, instanceName, parseInt(limit));
    
    console.log(`✅ ${messages.length} mensagens encontradas`);
    
    res.json({
      success: true,
      contact_id: contactId,
      instance_name: instanceName,
      messages_count: messages.length,
      data: messages
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter mensagens:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instances/:instanceName/send-message - Enviar mensagem
router.post('/instances/:instanceName/send-message', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, text, clientMessageId } = req.body;
    
    if (!number || !text) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'number and text are required' 
      });
    }
    
    // Validação adicional dos dados
    if (typeof number !== 'string' || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'number and text must be strings' 
      });
    }
 
    if (text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'text cannot be empty' 
      });
    }
 
    console.log(`📤 Enviando mensagem para ${number} via ${instanceName}...`);
    console.log(`📝 Texto: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
 
    const result = await whatsappService.sendMessage(instanceName, number, text, clientMessageId);
 
    console.log('✅ Mensagem enviada com sucesso');
 
    res.json({
      success: true,
      instance_name: instanceName,
      number: number,
      data: result
    });
 
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
 
    // Determinar o status HTTP apropriado baseado no tipo de erro
    let statusCode = 500;
    let errorMessage = error.message;
 
    if (error.message.includes('Instance not found') || error.message.includes('Instance is not connected')) {
      statusCode = 404;
      errorMessage = 'WhatsApp instance not found or not connected';
    } else if (error.message.includes('Invalid phone number') || error.message.includes('Contact not found')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('Client is not ready')) {
      statusCode = 503;
      errorMessage = 'WhatsApp client is not ready. Please wait for connection.';
    }
 
    res.status(statusCode).json({
      error: statusCode === 500 ? 'Internal Server Error' : 'Bad Request',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/whatsapp/instances/:instanceName/setup-webhook - Configurar webhook de mensagens
router.post('/instances/:instanceName/setup-webhook', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { enable = true } = req.body;
    
    console.log(`🔧 Configurando webhook de mensagens para ${instanceName}...`);
    
    if (enable) {
      await evolutionApiService.setupMessageWebhook(instanceName);
      console.log(`✅ Webhook de mensagens ativado para ${instanceName}`);
      
      res.json({
        success: true,
        instance_name: instanceName,
        message: 'Webhook de mensagens ativado com sucesso',
        status: 'enabled'
      });
    } else {
      // Desativar webhook (remover listeners)
      const client = evolutionApiService.instances.get(instanceName);
      if (client) {
        client.removeAllListeners('message');
        console.log(`✅ Webhook de mensagens desativado para ${instanceName}`);
      }
      
      res.json({
        success: true,
        instance_name: instanceName,
        message: 'Webhook de mensagens desativado com sucesso',
        status: 'disabled'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instances/:instanceName/process-message - Processar mensagem recebida manualmente
router.post('/instances/:instanceName/process-message', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { messageData } = req.body;
    
    if (!messageData || !messageData.from || !messageData.body) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'messageData with from and body is required' 
      });
    }
    
    console.log(`📨 Processando mensagem manualmente para ${instanceName}...`);
    
    await evolutionApiService.processReceivedMessage(instanceName, messageData);
    
    res.json({
      success: true,
      instance_name: instanceName,
      message: 'Mensagem processada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// ===== RELACIONAMENTOS CRM =====

// POST /api/whatsapp/contacts/:contactId/link-lead - Vincular contato a um lead
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
    
    console.log(`🔗 Vinculando contato ${contactId} ao lead ${leadId}...`);
    
    const relationship = await whatsappService.linkContactToLead(contactId, leadId, notes);
    
    console.log('✅ Contato vinculado ao lead com sucesso');
    
    res.json({
      success: true,
      contact_id: contactId,
      lead_id: leadId,
      data: relationship
    });
    
  } catch (error) {
    console.error('❌ Erro ao vincular contato ao lead:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/contacts/:contactId/link-customer - Vincular contato a um cliente
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
    
    console.log(`🔗 Vinculando contato ${contactId} ao cliente ${customerId}...`);
    
    const relationship = await whatsappService.linkContactToCustomer(contactId, customerId, notes);
    
    console.log('✅ Contato vinculado ao cliente com sucesso');
    
    res.json({
      success: true,
      contact_id: contactId,
      customer_id: customerId,
      data: relationship
    });
    
  } catch (error) {
    console.error('❌ Erro ao vincular contato ao cliente:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// PUT /api/whatsapp/contacts/:contactId/pipeline-status - Atualizar status do pipeline
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
    
    console.log(`📊 Atualizando status do pipeline para ${contactId}: ${pipelineStatus}`);
    
    const relationship = await whatsappService.updatePipelineStatus(contactId, pipelineStatus);
    
    console.log('✅ Status do pipeline atualizado com sucesso');
    
    res.json({
      success: true,
      contact_id: contactId,
      pipeline_status: pipelineStatus,
      data: relationship
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

// GET /api/whatsapp/instances/:instanceName/stats - Obter estatísticas da instância
router.get('/instances/:instanceName/stats', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    console.log(`📊 Obtendo estatísticas da instância ${instanceName}...`);
    
    const stats = await whatsappService.getInstanceStats(instanceName);
    
    console.log('✅ Estatísticas obtidas com sucesso');
    
    res.json({
      success: true,
      instance_name: instanceName,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/cache/stats - Obter estatísticas do cache
router.get('/cache/stats', authenticateApiKey, async (req, res) => {
  try {
    console.log('📊 Obtendo estatísticas do cache...');
    
    const stats = whatsappService.getCacheStats();
    
    console.log('✅ Estatísticas do cache obtidas com sucesso');
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas do cache:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/cache/clear - Limpar cache
router.post('/cache/clear', authenticateApiKey, async (req, res) => {
  try {
    const { pattern } = req.body;
    
    console.log('🗑️ Limpando cache...');
    
    whatsappService.clearCache(pattern);
    
    console.log('✅ Cache limpo com sucesso');
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      pattern: pattern || 'all'
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// SSE: stream de mensagens de uma conversa
router.get('/conversations/:contactId/stream', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { instance: instanceName } = req.query;
    if (!instanceName) {
      return res.status(400).json({ error: 'Bad Request', message: 'Instance parameter is required' });
    }

    // Configurar headers SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const events = require('../services/events');

    const send = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Enviar ping periódico para manter conexão
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);

    // Assinar eventos desta conversa
    const unsubscribe = events.subscribe(instanceName, contactId, send);

    // Encerrar conexão
    req.on('close', () => {
      clearInterval(ping);
      unsubscribe();
    });
  } catch (error) {
    console.error('❌ SSE error:', error);
    res.status(500).end();
  }
});

module.exports = router; 