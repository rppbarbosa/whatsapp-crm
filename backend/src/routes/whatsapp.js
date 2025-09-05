const express = require('express');
const router = express.Router();
const whatsappWebService = require('../services/whatsappWebService');
const messageService = require('../services/messageService');
const auth = require('../middleware/auth');

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

// ===== GESTÃO DE INSTÂNCIA ÚNICA =====

// GET /api/whatsapp/instance - Obter status da instância atual
router.get('/instance', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Obtendo status da instância...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.json({
        success: true,
        hasInstance: false,
        message: 'Nenhuma instância ativa'
      });
    }
    
    console.log('✅ Instância encontrada:', instance);
    
    res.json({
      success: true,
      hasInstance: true,
      data: instance
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter status da instância:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instance - Criar/Reiniciar instância
router.post('/instance', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'instanceName is required' 
      });
    }
    
    console.log(`📱 Criando/Reiniciando instância: ${instanceName}`);
    
    // Criar instância via WhatsApp Web
    const result = await whatsappWebService.createInstance(instanceName);
    
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

// DELETE /api/whatsapp/instance - Deletar instância atual
router.delete('/instance', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Deletando instância atual...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Nenhuma instância ativa para deletar' 
      });
    }
    
    await whatsappWebService.stopInstance();
    
    console.log('✅ Instância deletada com sucesso');
    
    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar instância:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/chats - Obter todas as conversas ativas
router.get('/chats', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Obtendo conversas ativas...');
    
    const chats = await whatsappWebService.getChats();
    
    // Formatar conversas para o frontend
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.id.user,
      isGroup: chat.isGroup || false,
      lastMessage: chat.lastMessage ? {
        body: chat.lastMessage.body || '',
        timestamp: chat.lastMessage.timestamp * 1000,
        from: chat.lastMessage.from,
        type: chat.lastMessage.type
      } : null,
      unreadCount: chat.unreadCount || 0,
      timestamp: chat.lastMessage ? chat.lastMessage.timestamp * 1000 : Date.now()
    }));
    
    console.log(`✅ ${formattedChats.length} conversas formatadas`);
    
    res.json({
      success: true,
      data: formattedChats
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter conversas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/chats/:chatId/contacts - Obter contatos de uma conversa
router.get('/chats/:chatId/contacts', authenticateApiKey, async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log(`📱 Obtendo contatos da conversa: ${chatId}`);
    
    const contacts = await whatsappWebService.getChatContacts(chatId);
    
    console.log(`✅ ${contacts.length} contatos obtidos`);
    
    res.json({
      success: true,
      data: contacts
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter contatos da conversa:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/chats/:chatId/messages - Obter mensagens de uma conversa
router.get('/chats/:chatId/messages', authenticateApiKey, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, beforeId } = req.query;
    
    console.log(`📱 Obtendo mensagens da conversa: ${chatId}, limite: ${limit}`);
    
    const messages = await whatsappWebService.getChatMessages(chatId, parseInt(limit), beforeId);
    
    console.log(`✅ ${messages.length} mensagens obtidas`);
    
    res.json({
      success: true,
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

// POST /api/whatsapp/chats/:chatId/read - Marcar conversa como lida
router.post('/chats/:chatId/read', authenticateApiKey, async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log(`📱 Marcando conversa como lida: ${chatId}`);
    
    const result = await whatsappWebService.markChatAsRead(chatId);
    
    console.log('✅ Conversa marcada como lida');
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao marcar conversa como lida:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/contacts/:contactId - Obter informações de um contato
router.get('/contacts/:contactId', authenticateApiKey, async (req, res) => {
  try {
    const { contactId } = req.params;
    console.log(`📱 Obtendo informações do contato: ${contactId}`);
    
    const contact = await whatsappWebService.getContactInfo(contactId);
    
    console.log('✅ Informações do contato obtidas');
    
    res.json({
      success: true,
      data: contact
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter informações do contato:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/sync - Sincronizar conversas de forma incremental
router.post('/sync', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Iniciando sincronização incremental...');
    
    const instance = whatsappWebService.getInstanceStatus();
    if (!instance || instance.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instância não está conectada' 
      });
    }
    
    // Iniciar sincronização em background
    whatsappWebService.syncConversationsIncremental(
      instance.instanceName, 
      whatsappWebService.instance.client
    );
    
    console.log('✅ Sincronização incremental iniciada');
    
    res.json({
      success: true,
      message: 'Sincronização incremental iniciada'
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar sincronização:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/reply - Responder diretamente a uma mensagem
router.post('/reply', authenticateApiKey, async (req, res) => {
  try {
    const { messageId, replyText } = req.body;
    
    if (!messageId || !replyText) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'messageId e replyText são obrigatórios' 
      });
    }
    
    console.log(`📱 Respondendo à mensagem ${messageId}: ${replyText}`);
    
    const result = await whatsappWebService.replyToMessage(
      'default', // Para MVP, usar instância padrão
      messageId, 
      replyText
    );
    
    console.log('✅ Resposta enviada com sucesso');
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao responder mensagem:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// POST /api/whatsapp/instance/send-message - Enviar mensagem
router.post('/instance/send-message', authenticateApiKey, async (req, res) => {
  try {
    const { to, toNumber, message } = req.body;
    
    // Aceitar tanto 'to' quanto 'toNumber' para compatibilidade
    const targetNumber = to || toNumber;
    
    if (!targetNumber || !message) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'toNumber (ou to) e message são obrigatórios' 
      });
    }
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || instance.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instância não está conectada' 
      });
    }
    
    console.log(`📱 Enviando mensagem para ${targetNumber}: ${message}`);
    
    const result = await whatsappWebService.sendMessage(instance.instanceName, targetNumber, message);
    
    console.log('✅ Mensagem enviada com sucesso');
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
});

// GET /api/whatsapp/instance/conversations - Obter conversas
router.get('/instance/conversations', authenticateApiKey, async (req, res) => {
  try {
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || instance.status !== 'connected') {
      // Retornar dados vazios em vez de erro 400
      return res.json({
        success: true,
        data: [],
        message: 'Instância não está conectada'
      });
    }
    
    const conversations = await messageService.getInstanceConversations(instance.instanceName);
    
    res.json({
      success: true,
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

// GET /api/whatsapp/instance/conversations/:conversationId/messages - Obter mensagens
router.get('/instance/conversations/:conversationId/messages', authenticateApiKey, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || instance.status !== 'connected') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instância não está conectada' 
      });
    }
    
    const messages = await messageService.getConversationMessages(instance.instanceName, conversationId);
    
    res.json({
      success: true,
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

// GET /api/whatsapp/instance/messages/stats - Estatísticas de mensagens
router.get('/instance/messages/stats', authenticateApiKey, async (req, res) => {
  try {
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || instance.status !== 'connected') {
      // Retornar estatísticas vazias em vez de erro 400
      return res.json({
        success: true,
        data: {
          totalLeads: 0,
          totalConversations: 0,
          messagesToday: 0,
          conversionRate: 0,
          leadsThisMonth: 0
        },
        message: 'Instância não está conectada'
      });
    }
    
    const stats = await messageService.getMessageStats(instance.instanceName);
    
    res.json({
      success: true,
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

// POST /api/whatsapp/instance/sync - Sincronizar conversas manualmente
router.post('/instance/sync', authenticateApiKey, async (req, res) => {
  try {
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({ error: 'Nenhuma instância ativa encontrada' });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({ error: 'Instância não está conectada' });
    }

    // Iniciar sincronização em background
    whatsappWebService.syncExistingConversations(instance.instanceName, whatsappWebService.instance.client)
      .then(() => {
        console.log('✅ Sincronização manual concluída');
      })
      .catch((error) => {
        console.error('❌ Erro na sincronização manual:', error);
      });

    res.json({
      success: true,
      message: 'Sincronização iniciada em background',
      instanceName: instance.instanceName
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/whatsapp/instance/qr-code - Obter QR code da instância
router.get('/instance/qr-code', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Obtendo QR code da instância...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Nenhuma instância ativa encontrada' 
      });
    }
    
    if (instance.status !== 'qr_ready') {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Instância não está com QR code pronto' 
      });
    }
    
    if (instance.qrCode) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        instanceName: instance.instanceName,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: false,
        message: 'QR Code não disponível'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/whatsapp/instance/check-status - Forçar verificação do estado
router.post('/instance/check-status', authenticateApiKey, async (req, res) => {
  try {
    console.log('🔍 Forçando verificação do estado da instância...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Nenhuma instância ativa encontrada' 
      });
    }
    
    // Forçar atualização do status no banco
    await whatsappWebService.updateInstanceStatus(instance.instanceName, instance.status);
    
    res.json({
      success: true,
      instance,
      message: 'Estado verificado e atualizado'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/whatsapp/instance/refresh-qr - Atualizar QR code
router.post('/instance/refresh-qr', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Atualizando QR code da instância...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Nenhuma instância ativa encontrada' 
      });
    }
    
    // Reiniciar instância para gerar novo QR code
    const result = await whatsappWebService.createInstance(instance.instanceName);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'QR Code atualizado com sucesso',
        instanceName: instance.instanceName
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar QR code'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/whatsapp/instance/cleanup - Limpeza inteligente da instância
router.post('/instance/cleanup', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName, force = false } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Nome da instância é obrigatório'
      });
    }

    console.log(`🧹 Limpeza inteligente da instância: ${instanceName} (force: ${force})`);
    
    const result = await whatsappWebService.cleanupInstance(instanceName, force);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        status: result.status || 'cleaned',
        phone: result.phone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Erro durante limpeza da instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/whatsapp/instance/force-stop - Forçar parada da instância
router.post('/instance/force-stop', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Nome da instância é obrigatório'
      });
    }

    console.log(`🛑 Forçando parada da instância: ${instanceName}`);
    
    const result = await whatsappWebService.forceStopInstance(instanceName);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('❌ Erro ao forçar parada da instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/whatsapp/instance/status - Obter status detalhado da instância
router.get('/instance/status', authenticateApiKey, async (req, res) => {
  try {
    console.log('📱 Obtendo status detalhado da instância...');
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Nenhuma instância ativa encontrada'
      });
    }

    // Status detalhado incluindo flag de autenticação
    const detailedStatus = {
      instanceName: instance.instanceName,
      status: instance.status,
      phone: instance.phone,
      qrCode: instance.qrCode,
      isAuthenticated: instance.isAuthenticated || false,
      createdAt: instance.createdAt,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      instance: detailedStatus
    });
  } catch (error) {
    console.error('❌ Erro ao obter status da instância:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// POST /api/whatsapp/instance/recover-user - Recuperar instâncias existentes do usuário
router.post('/instance/recover-user', authenticateApiKey, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'ID do usuário é obrigatório'
      });
    }

    console.log(`🔄 Recuperando instâncias do usuário: ${userId}`);
    
    const result = await whatsappWebService.recoverUserInstances(userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Recuperadas ${result.recovered}/${result.total} instâncias`,
        instances: result.instances,
        total: result.total,
        recovered: result.recovered
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erro ao recuperar instâncias do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 