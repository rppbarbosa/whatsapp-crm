const express = require('express');
const router = express.Router();
const wppconnectService = require('../services/wppconnectService');

// Middleware de autenticação
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers.apikey || req.headers['x-api-key'];
  const expectedKey = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
  
  if (apiKey === expectedKey) {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'API Key inválida' 
    });
  }
};

// Aplicar middleware em todas as rotas
router.use(authenticateApiKey);

// GET /api/whatsapp/status - Status do WhatsApp
router.get('/status', async (req, res) => {
  try {
    console.log('📱 Obtendo status via WPPConnect...');
    
    const result = await wppconnectService.getStatus();
    
    res.json({
      success: result.success,
      data: result.data,
      error: result.error
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/initialize - Inicializar WhatsApp
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Inicializando WhatsApp via WPPConnect...');
    
    const result = await wppconnectService.initialize();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/qr - Obter QR Code
router.get('/qr', async (req, res) => {
  try {
    const result = await wppconnectService.getStatus();
    
    if (result.success && result.data.qrCode) {
      res.json({
        success: true,
        qrCode: result.data.qrCode,
        status: result.data.status
      });
    } else if (result.success && result.data.isReady) {
      res.json({
        success: true,
        message: 'WhatsApp já está conectado',
        status: result.data.status,
        phone: result.data.phone
      });
    } else {
      res.json({
        success: false,
        message: 'QR Code não disponível',
        status: result.data ? result.data.status : 'disconnected'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/chats - Obter conversas
router.get('/chats', async (req, res) => {
  try {
    console.log('💬 Obtendo conversas via WPPConnect...');
    
    const result = await wppconnectService.getChats();
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? undefined : result.error
    });
  } catch (error) {
    console.error('❌ Erro ao obter chats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// GET /api/whatsapp/chats/:chatId/messages - Obter mensagens
router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;
    
    console.log(`📱 Obtendo mensagens do chat via WPPConnect: ${chatId.substring(0, 20)}...`);
    
    const result = await wppconnectService.getChatMessages(chatId, parseInt(limit));
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? undefined : result.error
    });
  } catch (error) {
    console.error('❌ Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// POST /api/whatsapp/send - Enviar mensagem
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros "to" e "message" são obrigatórios'
      });
    }
    
    console.log(`📤 Enviando mensagem via WPPConnect para: ${to}`);
    
    const result = await wppconnectService.sendMessage(to, message);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/destroy - Destruir instância
router.post('/destroy', async (req, res) => {
  try {
    console.log('🗑️ Desconectando WhatsApp via WPPConnect...');
    
    const result = await wppconnectService.disconnect();
    
    res.json({
      success: result.success,
      message: result.message || result.error
    });
  } catch (error) {
    console.error('❌ Erro ao destruir WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/chats/:chatId/mark-read - Marcar mensagens como lidas
router.post('/chats/:chatId/mark-read', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log(`📖 Marcando mensagens como lidas para: ${chatId.substring(0, 20)}...`);
    
    const result = await wppconnectService.markChatAsRead(chatId);
    
    res.json({
      success: result.success,
      message: result.success ? 'Mensagens marcadas como lidas' : result.error
    });
  } catch (error) {
    console.error('❌ Erro ao marcar como lida:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/health - Health check da WPPConnect
router.get('/health', async (req, res) => {
  try {
    const result = await wppconnectService.healthCheck();
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? 'WPPConnect funcionando' : result.error
    });
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
