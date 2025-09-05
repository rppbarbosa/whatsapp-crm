const EventEmitter = require('events');

class WhatsAppEvents extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map para armazenar clientes SSE por instância
    this.messageQueue = new Map(); // Fila de mensagens para cada instância
    this.connectionStats = new Map(); // Estatísticas de conexão por instância
    this.maxReconnectAttempts = 3; // Máximo de tentativas de reconexão
  }

  // Adicionar cliente SSE para uma instância
  addClient(instanceName, res) {
    try {
      if (!this.clients.has(instanceName)) {
        this.clients.set(instanceName, new Set());
        this.messageQueue.set(instanceName, []);
        this.connectionStats.set(instanceName, {
          totalConnections: 0,
          activeConnections: 0,
          failedConnections: 0,
          lastConnection: null,
          lastError: null
        });
      }

      const clientSet = this.clients.get(instanceName);
      const stats = this.connectionStats.get(instanceName);
      
      // Atualizar estatísticas
      stats.totalConnections++;
      stats.activeConnections++;
      stats.lastConnection = new Date().toISOString();

      clientSet.add(res);

      // Configurar headers SSE com melhor compatibilidade
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'X-Accel-Buffering': 'no', // Para Nginx
        'Transfer-Encoding': 'chunked'
      });

      // Enviar mensagem de conexão
      const connectionMessage = {
        type: 'connection',
        message: 'Conectado ao servidor de eventos',
        timestamp: new Date().toISOString(),
        instance: instanceName,
        clientId: res.socket?.remoteAddress || 'unknown'
      };

      res.write(`data: ${JSON.stringify(connectionMessage)}\n\n`);
      console.log(`✅ Cliente SSE adicionado para instância ${instanceName}. Total: ${clientSet.size}`);

      // Enviar mensagens em fila
      const queue = this.messageQueue.get(instanceName);
      if (queue && queue.length > 0) {
        console.log(`📤 Enviando ${queue.length} mensagens em fila para novo cliente`);
        queue.forEach(msg => {
          try {
            res.write(`data: ${JSON.stringify(msg)}\n\n`);
          } catch (error) {
            console.error(`❌ Erro ao enviar mensagem em fila:`, error.message);
          }
        });
      }

      // Configurar tratamento de erro e desconexão
      res.on('error', (error) => {
        console.error(`❌ Erro na conexão SSE para ${instanceName}:`, error.message);
        this.handleClientError(instanceName, res, error);
      });

      res.on('close', () => {
        console.log(`📡 Cliente SSE desconectado da instância ${instanceName}`);
        this.handleClientDisconnect(instanceName, res);
      });

      // Ping periódico para manter conexão
      const pingInterval = setInterval(() => {
        try {
          if (res.writableEnded || res.destroyed) {
            clearInterval(pingInterval);
            return;
          }
          res.write(`: ping ${Date.now()}\n\n`);
        } catch (error) {
          console.error(`❌ Erro no ping SSE para ${instanceName}:`, error.message);
          clearInterval(pingInterval);
          this.handleClientError(instanceName, res, error);
        }
      }, 25000);

      // Limpar intervalo quando conexão for fechada
      res.on('close', () => clearInterval(pingInterval));
      res.on('error', () => clearInterval(pingInterval));

    } catch (error) {
      console.error(`❌ Erro ao adicionar cliente SSE para ${instanceName}:`, error.message);
      this.handleClientError(instanceName, res, error);
    }
  }

  // Tratar erro do cliente
  handleClientError(instanceName, res, error) {
    try {
      const clientSet = this.clients.get(instanceName);
      const stats = this.connectionStats.get(instanceName);
      
      if (clientSet) {
        clientSet.delete(res);
        stats.activeConnections = Math.max(0, stats.activeConnections - 1);
        stats.lastError = {
          message: error.message,
          timestamp: new Date().toISOString()
        };
        
        if (clientSet.size === 0) {
          this.clients.delete(instanceName);
          this.messageQueue.delete(instanceName);
          console.log(`🧹 Todos os clientes desconectados da instância ${instanceName}`);
        }
      }
    } catch (cleanupError) {
      console.error(`❌ Erro ao limpar cliente com erro:`, cleanupError.message);
    }
  }

  // Tratar desconexão do cliente
  handleClientDisconnect(instanceName, res) {
    try {
      const clientSet = this.clients.get(instanceName);
      const stats = this.connectionStats.get(instanceName);
      
      if (clientSet) {
        clientSet.delete(res);
        stats.activeConnections = Math.max(0, stats.activeConnections - 1);
        
        if (clientSet.size === 0) {
          this.clients.delete(instanceName);
          this.messageQueue.delete(instanceName);
          console.log(`🧹 Todos os clientes desconectados da instância ${instanceName}`);
        }
      }
    } catch (cleanupError) {
      console.error(`❌ Erro ao limpar cliente desconectado:`, cleanupError.message);
    }
  }

  // Publicar evento para uma instância específica
  publish(instanceName, eventType, data) {
    try {
      const event = {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString(),
        instance: instanceName,
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Adicionar à fila
      if (!this.messageQueue.has(instanceName)) {
        this.messageQueue.set(instanceName, []);
      }
      const queue = this.messageQueue.get(instanceName);
      queue.push(event);

      // Manter apenas as últimas 100 mensagens na fila
      if (queue.length > 100) {
        const removed = queue.shift();
        console.log(`🗑️ Mensagem antiga removida da fila: ${removed.type}`);
      }

      // Enviar para todos os clientes conectados
      const clientSet = this.clients.get(instanceName);
      if (clientSet && clientSet.size > 0) {
        let successCount = 0;
        let errorCount = 0;

        clientSet.forEach(client => {
          try {
            if (!client.writableEnded && !client.destroyed) {
              client.write(`data: ${JSON.stringify(event)}\n\n`);
              successCount++;
            } else {
              // Cliente não está mais válido, remover
              clientSet.delete(client);
              errorCount++;
            }
          } catch (error) {
            console.error(`❌ Erro ao enviar evento para cliente SSE:`, error.message);
            clientSet.delete(client);
            errorCount++;
          }
        });

        // Atualizar estatísticas
        const stats = this.connectionStats.get(instanceName);
        if (stats) {
          stats.activeConnections = clientSet.size;
        }

        console.log(`📡 Evento ${eventType} publicado para instância ${instanceName} (${successCount} sucessos, ${errorCount} erros, ${clientSet.size} clientes ativos)`);
      } else {
        console.log(`⚠️ Nenhum cliente conectado para instância ${instanceName}, evento ${eventType} enfileirado`);
      }

      // Emitir evento localmente para outros serviços
      this.emit('event_published', { instanceName, eventType, data, event });

    } catch (error) {
      console.error(`❌ Erro ao publicar evento ${eventType} para ${instanceName}:`, error.message);
      this.emit('event_error', { instanceName, eventType, data, error });
    }
  }

  // Publicar mensagem recebida
  publishMessage(instanceName, messageData) {
    this.publish(instanceName, 'message_received', {
      id: messageData.id?._serialized || `msg_${Date.now()}`,
      from: messageData.from,
      body: messageData.body,
      timestamp: messageData.timestamp,
      type: messageData.type || 'text',
      isFromMe: false,
      metadata: {
        chatId: messageData.chat?.id?._serialized,
        quotedMessageId: messageData.quotedMsgId,
        mentions: messageData.mentionedIds
      }
    });
  }

  // Publicar mensagem enviada
  publishMessageSent(instanceName, messageData) {
    this.publish(instanceName, 'message_sent', {
      id: messageData.id?._serialized || `msg_${Date.now()}`,
      to: messageData.to,
      body: messageData.body,
      timestamp: messageData.timestamp,
      type: messageData.type || 'text',
      isFromMe: true,
      metadata: {
        chatId: messageData.chat?.id?._serialized,
        quotedMessageId: messageData.quotedMsgId
      }
    });
  }

  // Publicar atualização de status de mensagem
  publishMessageStatus(instanceName, messageId, status) {
    this.publish(instanceName, 'message_status', {
      messageId: messageId,
      status: status,
      timestamp: new Date().toISOString(),
      metadata: {
        statusCode: this.getStatusCode(status),
        statusDescription: this.getStatusDescription(status)
      }
    });
  }

  // Publicar atualização de contato
  publishContactUpdate(instanceName, contactData) {
    this.publish(instanceName, 'contact_updated', {
      id: contactData.id,
      name: contactData.name,
      phone: contactData.phone,
      isGroup: contactData.isGroup || false,
      timestamp: new Date().toISOString(),
      metadata: {
        profilePicUrl: contactData.profilePicUrl,
        status: contactData.status,
        isWAContact: contactData.isWAContact
      }
    });
  }

  // Publicar atualização de presença
  publishPresenceUpdate(instanceName, contactId, presence) {
    this.publish(instanceName, 'presence_updated', {
      contactId: contactId,
      presence: presence,
      timestamp: new Date().toISOString(),
      metadata: {
        lastSeen: presence === 'offline' ? new Date().toISOString() : null,
        isTyping: presence === 'typing',
        isRecording: presence === 'recording'
      }
    });
  }

  // Publicar atualização de instância
  publishInstanceUpdate(instanceName, status, phoneNumber = null) {
    this.publish(instanceName, 'instance_status', {
      status: status,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString(),
      metadata: {
        isConnected: status === 'connected',
        isReady: status === 'ready',
        hasPhoneNumber: !!phoneNumber
      }
    });
  }

  // Publicar sincronização de contatos
  publishContactsSync(instanceName, contactsCount) {
    this.publish(instanceName, 'contacts_synced', {
      count: contactsCount,
      timestamp: new Date().toISOString(),
      metadata: {
        syncType: 'full',
        estimatedTime: Math.ceil(contactsCount / 100) // Estimativa em segundos
      }
    });
  }

  // Publicar sincronização de mensagens
  publishMessagesSync(instanceName, messagesCount) {
    this.publish(instanceName, 'messages_synced', {
      count: messagesCount,
      timestamp: new Date().toISOString(),
      metadata: {
        syncType: 'full',
        estimatedTime: Math.ceil(messagesCount / 50) // Estimativa em segundos
      }
    });
  }

  // Obter estatísticas detalhadas
  getStats() {
    const stats = {
      totalInstances: this.clients.size,
      totalClients: 0,
      totalQueuedMessages: 0,
      messageQueues: {},
      connectionStats: {},
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    for (const [instanceName, clientSet] of this.clients) {
      const queue = this.messageQueue.get(instanceName) || [];
      const instanceStats = this.connectionStats.get(instanceName);
      
      stats.totalClients += clientSet.size;
      stats.totalQueuedMessages += queue.length;
      
      stats.messageQueues[instanceName] = {
        clients: clientSet.size,
        queuedMessages: queue.length,
        lastMessage: queue.length > 0 ? queue[queue.length - 1]?.timestamp : null
      };

      if (instanceStats) {
        stats.connectionStats[instanceName] = {
          ...instanceStats,
          successRate: instanceStats.totalConnections > 0 
            ? ((instanceStats.totalConnections - instanceStats.failedConnections) / instanceStats.totalConnections * 100).toFixed(2)
            : 0
        };
      }
    }

    return stats;
  }

  // Limpar dados de uma instância
  cleanupInstance(instanceName) {
    try {
      const clientSet = this.clients.get(instanceName);
      if (clientSet) {
        clientSet.forEach(client => {
          try {
            if (!client.writableEnded && !client.destroyed) {
              client.end();
            }
          } catch (error) {
            console.error(`❌ Erro ao finalizar cliente:`, error.message);
          }
        });
      }

      this.clients.delete(instanceName);
      this.messageQueue.delete(instanceName);
      this.connectionStats.delete(instanceName);
      
      console.log(`🧹 Dados de eventos limpos para instância ${instanceName}`);
    } catch (error) {
      console.error(`❌ Erro ao limpar instância ${instanceName}:`, error.message);
    }
  }

  // Utilitários para status de mensagem
  getStatusCode(status) {
    const statusMap = {
      'SENT': 1,
      'RECEIVED': 2,
      'READ': 3,
      'DELIVERED': 4,
      'FAILED': 5
    };
    return statusMap[status] || 0;
  }

  getStatusDescription(status) {
    const descriptions = {
      'SENT': 'Mensagem enviada',
      'RECEIVED': 'Mensagem recebida',
      'READ': 'Mensagem lida',
      'DELIVERED': 'Mensagem entregue',
      'FAILED': 'Falha no envio'
    };
    return descriptions[status] || 'Status desconhecido';
  }

  // Verificar saúde do sistema
  healthCheck() {
    const stats = this.getStats();
    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };

    // Verificar se há muitas mensagens em fila
    if (stats.totalQueuedMessages > 1000) {
      health.status = 'warning';
      health.issues.push('Muitas mensagens em fila');
      health.recommendations.push('Verificar se os clientes estão processando mensagens');
    }

    // Verificar se há instâncias sem clientes conectados
    for (const [instanceName, queueInfo] of Object.entries(stats.messageQueues)) {
      if (queueInfo.clients === 0 && queueInfo.queuedMessages > 0) {
        health.status = 'warning';
        health.issues.push(`Instância ${instanceName} tem mensagens em fila mas nenhum cliente conectado`);
        health.recommendations.push(`Verificar conectividade dos clientes para ${instanceName}`);
      }
    }

    // Verificar uso de memória
    const memoryUsage = stats.systemHealth.memoryUsage;
    if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      health.status = 'warning';
      health.issues.push('Uso alto de memória');
      health.recommendations.push('Considerar limpeza de cache e filas antigas');
    }

    return health;
  }
}

module.exports = new WhatsAppEvents(); 