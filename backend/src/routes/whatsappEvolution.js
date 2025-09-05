const express = require('express');
const router = express.Router();
// Usar Evolution API real via Docker
const evolutionApiService = require('../services/evolutionApiService');

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
    console.log('📱 Obtendo status via Evolution API...');
    
    const result = await evolutionApiService.getInstanceStatus();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.json({
        success: true, // Não é erro fatal
        data: result.data
      });
    }
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
    console.log('🚀 Inicializando WhatsApp via Evolution API...');
    
    // 1. Verificar se instância já existe
    const statusResult = await evolutionApiService.getInstanceStatus();
    
    if (statusResult.success) {
      console.log('✅ Instância já existe e está funcionando');
      return res.json({
        success: true,
        message: 'WhatsApp já está inicializado',
        status: statusResult.data.status,
        isReady: statusResult.data.isReady
      });
    }
    
    // 2. Criar instância se não existir
    const createResult = await evolutionApiService.createInstance();
    
    if (!createResult.success) {
      // Se erro for "já existe", tudo bem
      if (createResult.error?.response?.message?.[0]?.includes('already in use')) {
        console.log('✅ Instância já existe (detectado no erro)');
        return res.json({
          success: true,
          message: 'WhatsApp já está inicializado'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar instância: ' + JSON.stringify(createResult.error)
      });
    }

    // 3. Conectar instância (obter QR code)
    const connectResult = await evolutionApiService.connectInstance();
    
    if (!connectResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao conectar instância: ' + JSON.stringify(connectResult.error)
      });
    }

    res.json({
      success: true,
      message: 'WhatsApp inicializado com sucesso via Evolution API'
    });
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
    const result = await evolutionApiService.getInstanceStatus();
    
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
    const result = await evolutionApiService.getChats();
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? undefined : result.error
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
    
    const result = await evolutionApiService.getChatMessages(chatId, parseInt(limit));
    
    res.json({
      success: result.success,
      data: result.data,
      message: result.success ? undefined : result.error
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
    
    const result = await evolutionApiService.sendMessage(to, message);
    
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
    const result = await evolutionApiService.deleteInstance();
    
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

// GET /api/whatsapp/health - Health check da Evolution API
router.get('/health', async (req, res) => {
  try {
    const result = await evolutionApiService.healthCheck();
    
    res.json({
      success: result.success,
      data: result.data || { status: result.success ? 'OK' : 'ERROR' },
      message: result.success ? 'Evolution API funcionando' : result.error
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
