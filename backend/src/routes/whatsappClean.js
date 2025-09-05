const express = require('express');
const router = express.Router();
const whatsappWebService = require('../services/whatsappWebService');

// Rate limiting simples para evitar spam
const rateLimiter = new Map();

const checkRateLimit = (req, res, next) => {
  const clientId = req.ip;
  const now = Date.now();
  const windowMs = 1000; // 1 segundo
  
  if (!rateLimiter.has(clientId)) {
    rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const limit = rateLimiter.get(clientId);
  
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return next();
  }
  
  if (limit.count >= 2) { // Máximo 2 requests por segundo
    return res.status(429).json({
      success: false,
      error: 'Too many requests'
    });
  }
  
  limit.count++;
  next();
};

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
router.get('/status', checkRateLimit, async (req, res) => {
  try {
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.json({
        success: true,
        data: {
          status: 'disconnected',
          isReady: false,
          qrCode: null,
          phone: null
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        status: instance.status,
        isReady: instance.isAuthenticated,
        qrCode: instance.qrCode,
        phone: instance.phone
      }
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
    console.log('🚀 Inicializando WhatsApp...');
    
    const result = await whatsappWebService.createInstance('whatsapp-crm');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'WhatsApp inicializado com sucesso'
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
    const instance = whatsappWebService.getInstanceStatus();
    
    if (instance && instance.status === 'qr_ready' && instance.qrCode) {
      res.json({
        success: true,
        qrCode: instance.qrCode,
        status: instance.status
      });
    } else if (instance && instance.isAuthenticated) {
      res.json({
        success: true,
        message: 'WhatsApp já está conectado',
        status: instance.status,
        phone: instance.phone
      });
    } else {
      res.json({
        success: false,
        message: 'QR Code não disponível',
        status: instance ? instance.status : 'disconnected'
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
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || !instance.isAuthenticated) {
      return res.json({
        success: false,
        message: 'WhatsApp não está conectado',
        data: []
      });
    }

    const chats = await whatsappWebService.getChats();
    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('❌ Erro ao obter chats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/chats/:chatId/messages - Obter mensagens
router.get('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50 } = req.query;
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || !instance.isAuthenticated) {
      return res.json({
        success: false,
        message: 'WhatsApp não está conectado',
        data: []
      });
    }
    
    const messages = await whatsappWebService.getChatMessages(chatId, parseInt(limit));
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('❌ Erro ao obter mensagens:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance || !instance.isAuthenticated) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp não está conectado'
      });
    }
    
    const result = await whatsappWebService.sendMessage(to, message);
    res.json({
      success: true,
      data: result
    });
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
    const result = await whatsappWebService.stopInstance();
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao destruir WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/debug - Debug da instância
router.post('/debug', async (req, res) => {
  try {
    const instance = whatsappWebService.getInstanceStatus();
    
    if (!instance) {
      return res.json({
        success: true,
        debug: {
          hasInstance: false,
          message: 'Nenhuma instância ativa'
        }
      });
    }

    // Obter informações detalhadas
    const debug = {
      hasInstance: true,
      instanceName: instance.instanceName,
      status: instance.status,
      isAuthenticated: instance.isAuthenticated,
      phone: instance.phone,
      hasQrCode: !!instance.qrCode,
      qrCodeLength: instance.qrCode ? instance.qrCode.length : 0,
      createdAt: instance.createdAt,
      clientState: instance.client ? instance.client.state : 'NO_CLIENT',
      clientInfo: instance.client && instance.client.info ? 'HAS_INFO' : 'NO_INFO'
    };

    console.log('🔍 DEBUG da instância:', debug);

    res.json({
      success: true,
      debug
    });
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
