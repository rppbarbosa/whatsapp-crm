const wppconnect = require('@wppconnect-team/wppconnect');

class WPPConnectService {
  constructor() {
    this.client = null;
    this.sessionName = 'whatsapp-crm-session';
    this.isConnected = false;
    this.qrCode = null;
    this.status = 'disconnected';
    this.isInitializing = false;
    
    // Sistema de rastreamento de mensagens não lidas
    this.unreadMessages = new Map(); // chatId -> count
    this.lastReadMessages = new Map(); // chatId -> lastReadMessageId
    
    console.log('🚀 WPPConnect Service inicializado');
    
    // Tentar conectar automaticamente se houver sessão salva
    this.autoConnect();
  }

  // Tentar conectar automaticamente
  async autoConnect() {
    if (this.isInitializing) {
      console.log('⏳ Inicialização já em andamento...');
      return;
    }
    
    try {
      console.log('🔍 Verificando sessão existente...');
      await this.initialize();
    } catch (error) {
      console.log('⚠️ Erro na inicialização automática:', error.message);
    }
  }

  // Inicializar cliente WPPConnect
  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ Inicialização já em andamento, aguardando...');
      return { success: true, message: 'Inicialização em andamento' };
    }

    if (this.client) {
      console.log('✅ Cliente já inicializado');
      return { success: true, message: 'Cliente já inicializado' };
    }

    try {
      this.isInitializing = true;
      console.log('🔄 Inicializando WPPConnect...');
      
      this.client = await wppconnect.create({
        session: this.sessionName,
        catchQR: (base64Qr, asciiQR) => {
          console.log('📱 QR Code gerado');
          this.qrCode = base64Qr;
          this.status = 'qr_ready';
        },
        statusFind: (statusSession, session) => {
          console.log('📊 Status da sessão:', statusSession, session);
          
          switch (statusSession) {
            case 'isLogged':
            case 'chatsAvailable':
            case 'deviceNotConnected':
            case 'inChat':
              this.isConnected = true;
              this.status = 'connected';
              this.qrCode = null;
              console.log('✅ WhatsApp conectado com sucesso! Status:', statusSession);
              break;
            case 'notLogged':
            case 'qrReadError':
              this.isConnected = false;
              this.status = 'qr_ready';
              console.log('⏳ Aguardando leitura do QR Code... Status:', statusSession);
              break;
            case 'browserClose':
            case 'desconnectedMobile':
              this.isConnected = false;
              this.status = 'disconnected';
              console.log('❌ Desconectado. Status:', statusSession);
              break;
            case 'qrReadSuccess':
              this.status = 'connecting';
              console.log('🔄 QR Code lido, conectando...');
              break;
            case 'qrReadFail':
              this.status = 'qr_ready';
              console.log('❌ Falha ao ler QR Code');
              break;
            default:
              console.log('🤔 Status desconhecido:', statusSession);
              break;
          }
        },
        // Configurações do browser
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        browserWS: '',
        updatesLog: true,
        autoClose: 60000,
        createPathFileToken: true,
      });

      console.log('✅ Cliente WPPConnect criado com sucesso');
      
      // Configurar listeners de mensagens
      this.setupMessageListeners();
      
      this.isInitializing = false;
      return {
        success: true,
        message: 'WPPConnect inicializado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao inicializar WPPConnect:', error);
      this.status = 'error';
      this.isInitializing = false;
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isInitializing = false;
    }
  }

  // Obter status da conexão
  async getStatus() {
    try {
      let phone = null;
      
      if (this.client && this.isConnected) {
        try {
          const hostDevice = await this.client.getHostDevice();
          phone = hostDevice.id.user;
        } catch (err) {
          console.log('⚠️ Não foi possível obter número do telefone:', err.message);
        }
      }

      return {
        success: true,
        data: {
          status: this.status,
          isReady: this.isConnected,
          qrCode: this.qrCode,
          phone: phone,
          instanceName: this.sessionName
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      return {
        success: false,
        error: error.message,
        data: {
          status: 'error',
          isReady: false,
          qrCode: null,
          phone: null,
          instanceName: this.sessionName
        }
      };
    }
  }

  // Obter conversas
  async getChats() {
    try {
      if (!this.client) {
        return {
          success: false,
          error: 'Cliente WPPConnect não inicializado',
          data: []
        };
      }

      console.log('💬 Obtendo conversas via WPPConnect...');
      
      // Usar listChats em vez de getAllChats (função depreciada)
      const chats = await this.client.listChats();
      
      // Converter para nosso formato e buscar última mensagem
      const formattedChats = await Promise.all(chats.map(async (chat) => {
        let lastMessage = null;
        
        try {
          // Buscar última mensagem do chat
          const messages = await this.client.getAllMessagesInChat(chat.id._serialized, true, false);
          if (messages && messages.length > 0) {
            // Pegar a última mensagem (mais recente)
            const lastMsg = messages[messages.length - 1];
            lastMessage = {
              body: lastMsg.body || lastMsg.caption || '',
              timestamp: lastMsg.timestamp,
              from: lastMsg.from
            };
          }
        } catch (msgError) {
          console.log(`⚠️ Erro ao buscar última mensagem do chat ${chat.id._serialized}:`, msgError.message);
        }
        
        return {
          id: chat.id._serialized,
          name: chat.name || chat.contact?.pushname || chat.contact?.name || 'Sem nome',
          isGroup: chat.isGroup,
          lastMessage: lastMessage,
          unreadCount: this.unreadMessages.get(chat.id._serialized) || 0
        };
      }));

      console.log(`✅ ${formattedChats.length} conversas encontradas`);
      return {
        success: true,
        data: formattedChats
      };
    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Obter mensagens de uma conversa com histórico completo
  async getChatMessages(chatId, limit = 50, loadHistory = true) {
    try {
      if (!this.client || !this.isConnected) {
        return {
          success: false,
          error: 'WhatsApp não está conectado',
          data: []
        };
      }

      console.log(`📱 Obtendo mensagens do chat via WPPConnect: ${chatId.substring(0, 20)}...`);
      
      let messages = [];
      
      if (loadHistory) {
        console.log('🔄 Carregando histórico completo de mensagens...');
        try {
          // Tentar carregar histórico completo
          messages = await this.client.loadAndGetAllMessagesInChat(chatId, true, false);
          console.log(`📚 ${messages.length} mensagens carregadas do histórico completo`);
        } catch (historyError) {
          console.log('⚠️ Erro ao carregar histórico completo, usando método padrão:', historyError.message);
          // Fallback para método padrão se loadAndGetAllMessagesInChat falhar
          messages = await this.client.getAllMessagesInChat(chatId, true, false);
          
          // Se ainda não temos mensagens suficientes, tentar novamente
          if (!messages || messages.length < 2) {
            console.log('⚠️ Poucas mensagens encontradas, tentando novamente...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            messages = await this.client.getAllMessagesInChat(chatId, true, false);
            console.log(`📚 Nova tentativa: ${messages.length} mensagens carregadas`);
          }
        }
      } else {
        // Método padrão (apenas mensagens já carregadas)
        messages = await this.client.getAllMessagesInChat(chatId, true, false);
      }
      
      // Garantir que temos um array válido
      if (!Array.isArray(messages)) {
        console.error('❌ Resposta inválida do WPPConnect');
        return {
          success: false,
          error: 'Resposta inválida do WPPConnect',
          data: [],
          totalMessages: 0,
          hasMoreHistory: false
        };
      }

      // Formatar mensagens
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        body: msg.body || msg.caption || '',
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
        isFromMe: msg.fromMe,
        type: msg.type || 'text',
        author: msg.author || null,
        quotedMsg: msg.quotedMsg ? {
          body: msg.quotedMsg.body || '',
          author: msg.quotedMsg.author
        } : null
      }));

      console.log(`✅ ${formattedMessages.length} mensagens formatadas`);
      return {
        success: true,
        data: formattedMessages,
        totalMessages: messages.length,
        hasMoreHistory: messages.length > limit
      };
    } catch (error) {
      console.error('❌ Erro ao obter mensagens:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        totalMessages: 0,
        hasMoreHistory: false
      };
    }
  }

  // Carregar mensagens antigas (paginação)
  async loadEarlierMessages(chatId, beforeMessageId, limit = 50) {
    try {
      if (!this.client || !this.isConnected) {
        return {
          success: false,
          error: 'WhatsApp não está conectado',
          data: []
        };
      }

      console.log(`📜 Carregando mensagens anteriores do chat: ${chatId.substring(0, 20)}...`);
      
      // Carregar todas as mensagens primeiro (usar método disponível)
      let allMessages;
      if (typeof this.client.loadAndGetAllMessagesInChat === 'function') {
        allMessages = await this.client.loadAndGetAllMessagesInChat(chatId, true, false);
      } else {
        // Fallback para método padrão
        allMessages = await this.client.getAllMessagesInChat(chatId, true, false);
      }
      
      // Encontrar o índice da mensagem de referência
      const beforeIndex = allMessages.findIndex(msg => msg.id === beforeMessageId);
      
      if (beforeIndex === -1) {
        console.log('⚠️ Mensagem de referência não encontrada, retornando mensagens mais antigas');
        const earlierMessages = allMessages.slice(0, limit);
        
        const formattedMessages = earlierMessages.map(msg => ({
          id: msg.id,
          body: msg.body || msg.caption || '',
          timestamp: msg.timestamp,
          from: msg.from,
          to: msg.to,
          isFromMe: msg.fromMe,
          type: msg.type || 'text',
          author: msg.author || null,
          quotedMsg: msg.quotedMsg ? {
            body: msg.quotedMsg.body || '',
            author: msg.quotedMsg.author
          } : null
        }));

        return {
          success: true,
          data: formattedMessages,
          hasMore: allMessages.length > limit
        };
      }
      
      // Pegar mensagens anteriores à mensagem de referência
      const startIndex = Math.max(0, beforeIndex - limit);
      const earlierMessages = allMessages.slice(startIndex, beforeIndex);
      
      const formattedMessages = earlierMessages.map(msg => ({
        id: msg.id,
        body: msg.body || msg.caption || '',
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
        isFromMe: msg.fromMe,
        type: msg.type || 'text',
        author: msg.author || null,
        quotedMsg: msg.quotedMsg ? {
          body: msg.quotedMsg.body || '',
          author: msg.quotedMsg.author
        } : null
      }));

      console.log(`✅ ${formattedMessages.length} mensagens anteriores carregadas`);
      return {
        success: true,
        data: formattedMessages,
        hasMore: startIndex > 0
      };
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens anteriores:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        hasMore: false
      };
    }
  }

  // Enviar mensagem
  async sendMessage(to, message) {
    try {
      if (!this.client || !this.isConnected) {
        return {
          success: false,
          error: 'WhatsApp não está conectado'
        };
      }

      console.log(`📤 Enviando mensagem para: ${to}`);
      
      // Garantir formato correto do número
      const formattedTo = to.includes('@') ? to : `${to}@c.us`;
      
      const result = await this.client.sendText(formattedTo, message);
      
      console.log('✅ Mensagem enviada com sucesso');
      return {
        success: true,
        data: {
          messageId: result.id,
          to: formattedTo,
          message: message
        }
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Desconectar
  async disconnect() {
    try {
      if (this.client) {
        console.log('🔌 Desconectando WPPConnect...');
        await this.client.close();
        this.client = null;
        this.isConnected = false;
        this.status = 'disconnected';
        this.qrCode = null;
        console.log('✅ WPPConnect desconectado');
      }
      
      return {
        success: true,
        message: 'Desconectado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Marcar mensagens como lidas
  markMessagesAsRead(chatId) {
    if (this.unreadMessages.has(chatId)) {
      this.unreadMessages.set(chatId, 0);
      console.log(`📖 Mensagens marcadas como lidas para ${chatId.substring(0, 20)}...`);
      return { success: true, message: 'Mensagens marcadas como lidas' };
    }
    return { success: true, message: 'Nenhuma mensagem não lida encontrada' };
  }

  // Obter contagem de mensagens não lidas
  getUnreadCount(chatId) {
    return this.unreadMessages.get(chatId) || 0;
  }

  // Health check
  async healthCheck() {
    return {
      success: true,
      data: {
        service: 'WPPConnect',
        status: this.status,
        connected: this.isConnected,
        sessionName: this.sessionName
      }
    };
  }

  // Configurar listeners de mensagens
  setupMessageListeners() {
    if (!this.client) {
      console.log('❌ Cliente não disponível para configurar listeners');
      return;
    }

    console.log('🔌 Configurando listeners de mensagens...');

    // Listener para mensagens recebidas
    this.client.onMessage(async (message) => {
      console.log('📨 Mensagem recebida:', {
        from: message.from,
        body: message.body?.substring(0, 50) + '...',
        isFromMe: message.fromMe,
        timestamp: new Date(message.timestamp * 1000).toLocaleString()
      });

      // Rastrear mensagens não lidas apenas para mensagens recebidas (não enviadas)
      if (!message.fromMe) {
        const chatId = message.from;
        const currentCount = this.unreadMessages.get(chatId) || 0;
        this.unreadMessages.set(chatId, currentCount + 1);
        console.log(`📊 Mensagem não lida adicionada para ${chatId.substring(0, 20)}... (total: ${currentCount + 1})`);
      }

      // Não fazer carregamento automático aqui para evitar conflitos
      // O frontend já tem polling que vai detectar as mudanças
    });

    // Listener para mensagens enviadas
    this.client.onAnyMessage(async (message) => {
      if (message.fromMe) {
        console.log('📤 Mensagem enviada confirmada:', {
          to: message.to,
          body: message.body?.substring(0, 50) + '...',
          timestamp: new Date(message.timestamp * 1000).toLocaleString()
        });

        try {
          // Carregar mensagens atualizadas do chat
          const chatId = message.to;
          const messages = await this.client.getAllMessagesInChat(chatId, true, false);
          
          // Formatar e retornar as últimas 50 mensagens
          const formattedMessages = messages.slice(-50).map(msg => ({
            id: msg.id,
            body: msg.body || msg.caption || '',
            timestamp: msg.timestamp,
            from: msg.from,
            to: msg.to,
            isFromMe: msg.fromMe,
            type: msg.type || 'text',
            author: msg.author || null,
            quotedMsg: msg.quotedMsg ? {
              body: msg.quotedMsg.body || '',
              author: msg.quotedMsg.author
            } : null
          }));

          // Notificar o frontend via API
          fetch(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/whatsapp/notify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure'
            },
            body: JSON.stringify({
              chatId,
              messages: formattedMessages,
              totalMessages: messages.length,
              hasMoreHistory: messages.length > 50
            })
          });
        } catch (error) {
          console.error('❌ Erro ao processar mensagem enviada:', error);
        }
      }
    });

    console.log('✅ Listeners de mensagens configurados');
  }

  // Marcar conversa como lida
  async markChatAsRead(chatId) {
    try {
      if (!this.client || !this.isConnected) {
        return {
          success: false,
          error: 'WhatsApp não está conectado'
        };
      }

      console.log(`📖 Marcando conversa como lida: ${chatId.substring(0, 20)}...`);
      
      // Usar a função do WPPConnect para marcar como lida
      await this.client.markUnseenMessage(chatId);
      
      console.log('✅ Conversa marcada como lida');
      return {
        success: true,
        message: 'Conversa marcada como lida'
      };
    } catch (error) {
      console.error('❌ Erro ao marcar conversa como lida:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única (Singleton)
module.exports = new WPPConnectService();
