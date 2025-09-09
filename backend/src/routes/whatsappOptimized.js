const express = require('express');
const router = express.Router();
const MessagePersistenceService = require('../services/messagePersistenceService');
const WebSocketService = require('../services/websocketService');

// Middleware de autenticação (simplificado)
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['apikey'] || req.query.apikey;
  const validApiKey = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'API Key inválida' 
    });
  }
  
  next();
};

// GET /api/whatsapp-optimized/conversations - Obter conversas do Supabase
router.get('/conversations', authenticateApiKey, async (req, res) => {
  try {
    const { instanceName = 'whatsapp-crm-session', limit = 100 } = req.query;
    
    console.log(`📊 Obtendo conversas otimizadas para instância: ${instanceName}`);
    
    const result = await MessagePersistenceService.getConversations(instanceName, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: `${result.data.length} conversas encontradas`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: []
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter conversas otimizadas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// GET /api/whatsapp-optimized/messages/:conversationId - Obter mensagens do Supabase
router.get('/messages/:conversationId', authenticateApiKey, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log(`📱 Obtendo mensagens otimizadas para conversa: ${conversationId}`);
    
    const result = await MessagePersistenceService.getMessages(
      conversationId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        fromCache: result.fromCache || false,
        totalMessages: result.data.length,
        hasMoreHistory: result.data.length === parseInt(limit)
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        data: []
      });
    }
  } catch (error) {
    console.error('❌ Erro ao obter mensagens otimizadas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// GET /api/whatsapp-optimized/websocket/info - Informações do WebSocket
router.get('/websocket/info', authenticateApiKey, (req, res) => {
  try {
    const stats = WebSocketService.getStats();
    const wsUrl = `${req.protocol === 'https' ? 'wss' : 'ws'}://${req.get('host')}/ws`;
    
    res.json({
      success: true,
      data: {
        websocketUrl: wsUrl,
        stats: stats,
        instructions: {
          connect: `Conectar via WebSocket: ${wsUrl}?token=YOUR_TOKEN&userId=USER_ID`,
          joinRoom: 'Enviar: {"type": "join_room", "roomId": "conversationId"}',
          listen: 'Escutar eventos: new_message, message_status, whatsapp_status'
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter informações do WebSocket:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp-optimized/websocket/broadcast - Broadcast para WebSocket (admin)
router.post('/websocket/broadcast', authenticateApiKey, (req, res) => {
  try {
    const { type, data, roomId } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de mensagem é obrigatório'
      });
    }
    
    const message = {
      type,
      data,
      timestamp: Date.now()
    };
    
    let sentCount;
    if (roomId) {
      sentCount = WebSocketService.sendToRoom(roomId, message);
    } else {
      sentCount = WebSocketService.broadcast(message);
    }
    
    res.json({
      success: true,
      data: {
        sentCount,
        message: `Mensagem enviada para ${sentCount} clientes`
      }
    });
  } catch (error) {
    console.error('❌ Erro no broadcast:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp-optimized/stats - Estatísticas do sistema
router.get('/stats', authenticateApiKey, (req, res) => {
  try {
    const wsStats = WebSocketService.getStats();
    
    res.json({
      success: true,
      data: {
        websocket: wsStats,
        persistence: {
          activeCacheSize: MessagePersistenceService.activeMessagesCache.size,
          cacheExpiry: MessagePersistenceService.cacheExpiry
        },
        performance: {
          recommendations: [
            'Use WebSocket para tempo real',
            'Cache inteligente ativo',
            'Persistência imediata no Supabase',
            'Sem polling desnecessário'
          ]
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
