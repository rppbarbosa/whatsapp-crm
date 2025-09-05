const { Server } = require('socket.io');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Map para armazenar clientes por instância
    this.authenticatedClients = new Set(); // Set para clientes autenticados
  }

  // Inicializar o servidor WebSocket
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Configurar global.io para uso em outros serviços
    global.io = this.io;

    this.setupEventHandlers();
    console.log('✅ WebSocket inicializado com sucesso');
  }

  // Configurar handlers de eventos
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📡 Cliente WebSocket conectado: ${socket.id}`);

      // Evento de autenticação (desabilitado - usando API REST)
      socket.on('authenticate', (data) => {
        const { apiKey } = data;
        
        if (this.authenticateClient(apiKey)) {
          this.authenticatedClients.add(socket.id);
          
          socket.emit('authenticated', { 
            success: true, 
            message: 'Autenticado com sucesso via WebSocket'
          });
          
          console.log(`✅ Cliente ${socket.id} autenticado via WebSocket`);
        } else {
          socket.emit('authenticated', { 
            success: false, 
            message: 'API Key inválida' 
          });
          
          console.log(`❌ Falha na autenticação do cliente ${socket.id}`);
        }
      });

      // Evento de desconexão
      socket.on('disconnect', () => {
        console.log(`📡 Cliente WebSocket desconectado: ${socket.id}`);
        this.removeClient(socket.id);
      });

      // Evento de join em uma instância
      socket.on('join_instance', (instanceName) => {
        if (this.authenticatedClients.has(socket.id)) {
          this.addClientToInstance(socket, instanceName);
          socket.emit('joined_instance', { 
            success: true, 
            instanceName 
          });
        }
      });

      // Evento de leave de uma instância
      socket.on('leave_instance', (instanceName) => {
        this.removeClientFromInstance(socket.id, instanceName);
        socket.emit('left_instance', { 
          success: true, 
          instanceName 
        });
      });

      // Evento para sincronizar conversas
      socket.on('sync_conversations', async (data) => {
        if (this.authenticatedClients.has(socket.id)) {
          try {
            const whatsappWebService = require('./whatsappWebService');
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
            
            socket.emit('conversations_synced', {
              success: true,
              data: formattedChats
            });
            
            console.log(`📡 Conversas sincronizadas para cliente ${socket.id}: ${formattedChats.length} conversas`);
          } catch (error) {
            console.error('❌ Erro ao sincronizar conversas:', error);
            socket.emit('conversations_synced', {
              success: false,
              error: error.message
            });
          }
        }
      });

      // Evento para obter mensagens de uma conversa
      socket.on('get_chat_messages', async (data) => {
        if (this.authenticatedClients.has(socket.id)) {
          try {
            const { chatId, limit = 50, beforeId } = data;
            const whatsappWebService = require('./whatsappWebService');
            
            const messages = await whatsappWebService.getChatMessages(chatId, limit, beforeId);
            
            socket.emit('chat_messages_loaded', {
              success: true,
              chatId,
              data: messages
            });
            
            console.log(`📡 Mensagens carregadas para conversa ${chatId}: ${messages.length} mensagens`);
          } catch (error) {
            console.error('❌ Erro ao carregar mensagens:', error);
            socket.emit('chat_messages_loaded', {
              success: false,
              chatId: data.chatId,
              error: error.message
            });
          }
        }
      });

      // Evento para marcar conversa como lida
      socket.on('mark_chat_read', async (data) => {
        if (this.authenticatedClients.has(socket.id)) {
          try {
            const { chatId } = data;
            const whatsappWebService = require('./whatsappWebService');
            
            await whatsappWebService.markChatAsRead(chatId);
            
            socket.emit('chat_marked_read', {
              success: true,
              chatId
            });
            
            // Notificar outros clientes sobre a mudança
            socket.broadcast.emit('chat_updated', {
              type: 'marked_read',
              chatId
            });
            
            console.log(`📡 Conversa ${chatId} marcada como lida`);
          } catch (error) {
            console.error('❌ Erro ao marcar conversa como lida:', error);
            socket.emit('chat_marked_read', {
              success: false,
              chatId: data.chatId,
              error: error.message
            });
          }
        }
      });

      // Evento para obter informações de um contato
      socket.on('get_contact_info', async (data) => {
        if (this.authenticatedClients.has(socket.id)) {
          try {
            const { contactId } = data;
            const whatsappWebService = require('./whatsappWebService');
            
            const contact = await whatsappWebService.getContactInfo(contactId);
            
            socket.emit('contact_info_loaded', {
              success: true,
              contactId,
              data: contact
            });
            
            console.log(`📡 Informações do contato ${contactId} carregadas`);
          } catch (error) {
            console.error('❌ Erro ao carregar informações do contato:', error);
            socket.emit('contact_info_loaded', {
              success: false,
              contactId: data.contactId,
              error: error.message
            });
          }
        }
      });

      // Evento para responder diretamente a uma mensagem
      socket.on('reply_to_message', async (data) => {
        if (this.authenticatedClients.has(socket.id)) {
          try {
            const { messageId, replyText } = data;
            const whatsappWebService = require('./whatsappWebService');
            
            const result = await whatsappWebService.replyToMessage(
              'default', // Para MVP, usar instância padrão
              messageId, 
              replyText
            );
            
            socket.emit('message_replied', {
              success: true,
              messageId,
              data: result
            });
            
            // Notificar outros clientes sobre a nova mensagem
            socket.broadcast.emit('new_message', {
              type: 'reply',
              messageId,
              replyTo: messageId,
              content: replyText
            });
            
            console.log(`📡 Mensagem ${messageId} respondida com sucesso`);
          } catch (error) {
            console.error('❌ Erro ao responder mensagem:', error);
            socket.emit('message_replied', {
              success: false,
              messageId: data.messageId,
              error: error.message
            });
          }
        }
      });
    });
  }

  // Autenticar cliente
  authenticateClient(apiKey) {
    const expectedKey = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
    return apiKey === expectedKey;
  }

  // Adicionar cliente a uma instância
  addClientToInstance(socket, instanceName) {
    // Se for 'all', adicionar a todas as instâncias existentes
    if (instanceName === 'all') {
      // Adicionar a todas as instâncias existentes
      for (const [existingInstanceName, clients] of this.connectedClients.entries()) {
        clients.add(socket.id);
      }
      
      // Adicionar metadados ao socket
      socket.instanceName = 'all';
      socket.allInstances = true;
      
      console.log(`📱 Cliente ${socket.id} adicionado a TODAS as instâncias. Total: ${this.connectedClients.size}`);
      return;
    }
    
    if (!this.connectedClients.has(instanceName)) {
      this.connectedClients.set(instanceName, new Set());
    }
    
    const clients = this.connectedClients.get(instanceName);
    clients.add(socket.id);
    
    // Adicionar metadados ao socket
    socket.instanceName = instanceName;
    
    console.log(`📱 Cliente ${socket.id} adicionado à instância ${instanceName}. Total: ${clients.size}`);
  }

  // Remover cliente de uma instância
  removeClientFromInstance(socketId, instanceName) {
    const clients = this.connectedClients.get(instanceName);
    if (clients) {
      clients.delete(socketId);
      console.log(`📱 Cliente ${socketId} removido da instância ${instanceName}. Total: ${clients.size}`);
    }
  }

  // Remover cliente completamente
  removeClient(socketId) {
    this.authenticatedClients.delete(socketId);
    
    // Remover de todas as instâncias
    for (const [instanceName, clients] of this.connectedClients.entries()) {
      clients.delete(socketId);
    }
  }

  // Enviar evento para uma instância específica
  emitToInstance(instanceName, event, data) {
    const clients = this.connectedClients.get(instanceName);
    if (clients && clients.size > 0) {
      console.log(`📤 Enviando evento ${event} para ${clients.size} clientes da instância ${instanceName}`);
      
      // Enviar para todos os clientes da instância
      for (const socketId of clients) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
    
    // Também enviar para clientes que estão conectados a 'all'
    const allClients = this.connectedClients.get('all');
    if (allClients && allClients.size > 0) {
      console.log(`📤 Enviando evento ${event} para ${allClients.size} clientes 'all' da instância ${instanceName}`);
      
      for (const socketId of allClients) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket && socket.allInstances) {
          socket.emit(event, data);
        }
      }
    }
    
    if ((!clients || clients.size === 0) && (!allClients || allClients.size === 0)) {
      console.log(`⚠️ Nenhum cliente conectado para a instância ${instanceName}`);
    }
  }

  // Enviar evento para todos os clientes
  emitToAll(event, data) {
    this.io.emit(event, data);
  }

  // Obter estatísticas
  getStats() {
    const stats = {
      totalClients: this.authenticatedClients.size,
      instances: {}
    };

    for (const [instanceName, clients] of this.connectedClients.entries()) {
      stats.instances[instanceName] = {
        connectedClients: clients.size,
        clientIds: Array.from(clients)
      };
    }

    return stats;
  }

  // Health check
  healthCheck() {
    return {
      status: 'healthy',
      totalClients: this.authenticatedClients.size,
      totalInstances: this.connectedClients.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new WebSocketService(); 