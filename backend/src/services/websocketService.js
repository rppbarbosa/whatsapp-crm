const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket
    this.rooms = new Map(); // roomId -> Set of userIds
  }

  // Inicializar servidor WebSocket
  init(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    console.log('✅ WebSocket Server iniciado na porta /ws');
  }

  // Verificar cliente (autenticação)
  verifyClient(info) {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    
    // TODO: Implementar verificação de token JWT
    // Por enquanto, aceitar todas as conexões
    return true;
  }

  // Gerenciar nova conexão
  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId') || 'anonymous';
    
    console.log(`🔌 Nova conexão WebSocket: ${userId}`);
    
    // Armazenar cliente
    this.clients.set(userId, ws);
    
    // Configurar eventos do cliente
    ws.on('message', (data) => this.handleMessage(userId, data));
    ws.on('close', () => this.handleDisconnect(userId));
    ws.on('error', (error) => this.handleError(userId, error));
    
    // Enviar confirmação de conexão
    this.sendToUser(userId, {
      type: 'connection_established',
      timestamp: Date.now()
    });
  }

  // Processar mensagem do cliente
  handleMessage(userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'join_room':
          this.joinRoom(userId, message.roomId);
          break;
        case 'leave_room':
          this.leaveRoom(userId, message.roomId);
          break;
        case 'ping':
          this.sendToUser(userId, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          console.log(`📨 Mensagem desconhecida de ${userId}:`, message.type);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem de ${userId}:`, error);
    }
  }

  // Cliente desconectou
  handleDisconnect(userId) {
    console.log(`🔌 Cliente desconectado: ${userId}`);
    
    // Remover de todas as salas
    for (const [roomId, users] of this.rooms.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    // Remover cliente
    this.clients.delete(userId);
  }

  // Erro no cliente
  handleError(userId, error) {
    console.error(`❌ Erro no WebSocket de ${userId}:`, error);
    this.handleDisconnect(userId);
  }

  // Entrar em uma sala (conversa)
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(userId);
    console.log(`👥 ${userId} entrou na sala ${roomId}`);
    
    this.sendToUser(userId, {
      type: 'room_joined',
      roomId: roomId,
      timestamp: Date.now()
    });
  }

  // Sair de uma sala
  leaveRoom(userId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(userId);
      
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
      
      console.log(`👋 ${userId} saiu da sala ${roomId}`);
    }
  }

  // Enviar mensagem para usuário específico
  sendToUser(userId, data) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${userId}:`, error);
        this.handleDisconnect(userId);
        return false;
      }
    }
    return false;
  }

  // Enviar mensagem para sala (conversa)
  sendToRoom(roomId, data, excludeUserId = null) {
    if (!this.rooms.has(roomId)) {
      return 0;
    }

    let sentCount = 0;
    const users = this.rooms.get(roomId);
    
    for (const userId of users) {
      if (excludeUserId && userId === excludeUserId) {
        continue;
      }
      
      if (this.sendToUser(userId, data)) {
        sentCount++;
      }
    }
    
    return sentCount;
  }

  // Notificar nova mensagem
  notifyNewMessage(conversationId, message) {
    const data = {
      type: 'new_message',
      conversationId: conversationId,
      message: message,
      timestamp: Date.now()
    };

    const sentCount = this.sendToRoom(conversationId, data);
    console.log(`📨 Nova mensagem notificada para ${sentCount} usuários na conversa ${conversationId}`);
    
    return sentCount;
  }

  // Notificar status de mensagem (enviada, entregue, lida)
  notifyMessageStatus(messageId, status, conversationId) {
    const data = {
      type: 'message_status',
      messageId: messageId,
      status: status,
      conversationId: conversationId,
      timestamp: Date.now()
    };

    const sentCount = this.sendToRoom(conversationId, data);
    console.log(`📊 Status de mensagem notificado: ${messageId} -> ${status}`);
    
    return sentCount;
  }

  // Notificar status do WhatsApp (conectado, desconectado, QR)
  notifyWhatsAppStatus(status, data = {}) {
    const message = {
      type: 'whatsapp_status',
      status: status,
      data: data,
      timestamp: Date.now()
    };

    let sentCount = 0;
    for (const userId of this.clients.keys()) {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    }
    
    console.log(`📱 Status do WhatsApp notificado para ${sentCount} usuários: ${status}`);
    return sentCount;
  }

  // Obter estatísticas
  getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([roomId, users]) => ({
        roomId,
        userCount: users.size
      }))
    };
  }

  // Broadcast para todos os clientes
  broadcast(data) {
    let sentCount = 0;
    for (const userId of this.clients.keys()) {
      if (this.sendToUser(userId, data)) {
        sentCount++;
      }
    }
    return sentCount;
  }
}

module.exports = new WebSocketService();