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
    this.mediaCache = new Map(); // messageId -> mediaInfo (cache para evitar reprocessar)
    
    // Limpar cache de mídias a cada 5 minutos para evitar thumbnails
    setInterval(() => {
      console.log('🧹 Limpando cache de mídias...');
      this.mediaCache.clear();
    }, 5 * 60 * 1000);
    
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
          lastMessage: lastMessage ? {
            ...lastMessage,
            timestamp: lastMessage.timestamp ? lastMessage.timestamp : Date.now()
          } : null,
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
      const formattedMessages = await Promise.all(messages.map(async (msg) => {
        const formattedMsg = {
          id: msg.id,
          body: msg.body || msg.caption || '',
          timestamp: msg.timestamp ? msg.timestamp : Date.now(),
          from: msg.from,
          to: msg.to,
          isFromMe: msg.fromMe,
          type: msg.type || 'text',
          author: msg.author || null,
          quotedMsg: msg.quotedMsg ? {
            body: msg.quotedMsg.body || '',
            author: msg.quotedMsg.author
          } : null
        };

        // Processar informações de mídia se for uma mensagem de mídia
        if (msg.type && ['image', 'video', 'audio', 'document', 'ptt', 'sticker'].includes(msg.type)) {
          try {
            // Log do filename original da mensagem
            console.log(`📁 Filename original da mensagem ${msg.id}:`, msg.filename);
            
            // Obter informações da mídia
            const mediaInfo = await this.getMediaInfo(msg);
            formattedMsg.mediaInfo = mediaInfo;
            
            // Log do filename final
            console.log(`📁 Filename final da mídia:`, mediaInfo.filename);
          } catch (error) {
            console.log(`⚠️ Erro ao obter informações de mídia para mensagem ${msg.id}:`, error.message);
            formattedMsg.mediaInfo = {
              type: msg.type,
              hasMedia: true,
              error: 'Erro ao carregar mídia'
            };
          }
        }

        return formattedMsg;
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

  // Detectar tipo MIME a partir de dados base64
  getMimeTypeFromBase64(base64String) {
    if (!base64String || typeof base64String !== 'string') return 'application/octet-stream';
    
    // Verificar assinaturas de arquivos conhecidas
    if (base64String.startsWith('/9j/') || base64String.startsWith('iVBORw0KGgo')) {
      return 'image/jpeg';
    }
    if (base64String.startsWith('iVBORw0KGgo')) {
      return 'image/png';
    }
    if (base64String.startsWith('UklGR')) {
      return 'audio/wav';
    }
    if (base64String.startsWith('SUQz')) {
      return 'audio/mpeg';
    }
    if (base64String.startsWith('R0lGOD')) {
      return 'image/gif';
    }
    if (base64String.startsWith('UklGR')) {
      return 'audio/wav';
    }
    if (base64String.startsWith('JVBERi0')) {
      return 'application/pdf';
    }
    
    return 'application/octet-stream';
  }

  // Detectar tipo de mídia baseado no conteúdo base64
  detectMediaTypeFromBase64(base64String) {
    if (!base64String || typeof base64String !== 'string') return 'document';
    
    // Imagens
    if (base64String.startsWith('/9j/') || base64String.startsWith('iVBORw0KGgo') || base64String.startsWith('R0lGOD')) {
      return 'image';
    }
    
    // Áudios
    if (base64String.startsWith('UklGR') || base64String.startsWith('SUQz')) {
      return 'audio';
    }
    
    // Vídeos (mais difícil de detectar, mas podemos tentar)
    if (base64String.startsWith('AAAAIGZ0eXBpc29t')) {
      return 'video';
    }
    
    return 'document';
  }

  // Obter extensão de arquivo baseada no MIME type
  getFileExtension(mimetype) {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/mov': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    
    return mimeMap[mimetype] || 'bin';
  }

  // Obter informações de mídia de uma mensagem usando API REST oficial
  async getMediaInfo(message) {
    try {
      // Verificar cache primeiro
      if (this.mediaCache.has(message.id)) {
        console.log(`📋 Mídia ${message.id} encontrada no cache`);
        return this.mediaCache.get(message.id);
      }

      const mediaInfo = {
        type: message.type,
        hasMedia: true,
        filename: null,
        mimetype: null,
        size: null,
        duration: null,
        thumbnail: null,
        url: null
      };

      // Obter informações básicas da mídia
      if (message.mediaData) {
        mediaInfo.filename = message.mediaData.filename || null;
        mediaInfo.mimetype = message.mediaData.mimetype || null;
        mediaInfo.size = message.mediaData.size || null;
      }
      
      // Preservar filename original da mensagem se disponível
      if (message.filename && !mediaInfo.filename) {
        mediaInfo.filename = message.filename;
        console.log(`📁 Preservando filename original: ${message.filename}`);
      }
      
      // Log detalhado do filename
      console.log(`📁 Filename da mensagem: ${message.filename || 'N/A'}`);
      console.log(`📁 Filename do mediaData: ${message.mediaData?.filename || 'N/A'}`);
      console.log(`📁 Filename final: ${mediaInfo.filename || 'N/A'}`);

      // Para áudios e vídeos, obter duração
      if (message.type === 'audio' || message.type === 'ptt' || message.type === 'video') {
        mediaInfo.duration = message.duration || null;
      }

      // Tentar obter mídia usando métodos do cliente WPPConnect
      if (message.id && ['image', 'video', 'audio', 'document', 'ptt', 'sticker'].includes(message.type)) {
        try {
          if (this.client && this.isConnected) {
            try {
              console.log(`📥 Tentando baixar mídia para mensagem ${message.id}...`);
              
              // MÉTODO PRINCIPAL: downloadMedia com força para qualidade original
              let mediaData = null;
              try {
                console.log(`🔄 Tentando downloadMedia para obter qualidade original...`);
                mediaData = await this.client.downloadMedia(message, true);
                console.log(`📥 downloadMedia resultado:`, { 
                  hasData: !!mediaData?.data, 
                  size: mediaData?.data?.length || 0,
                  mimetype: mediaData?.mimetype 
                });
              } catch (error) {
                console.log(`⚠️ downloadMedia falhou: ${error.message}`);
              }

              // MÉTODO FALLBACK: decryptFile (se downloadMedia falhar ou retornar thumbnail)
              if (!mediaData || !mediaData.data || (mediaData.data.length < 10000 && mediaData.data.length > 0)) {
                try {
                  console.log(`🔄 Fallback: tentando decryptFile...`);
                  const decryptedMedia = await this.client.decryptFile(message);
                  if (decryptedMedia && decryptedMedia.length > (mediaData?.data?.length || 0)) {
                    console.log(`✅ decryptFile retornou arquivo maior: ${decryptedMedia.length} bytes`);
                    mediaData = {
                      data: decryptedMedia.toString('base64'),
                      mimetype: message.mimetype || this.getMimeTypeFromBase64(decryptedMedia.toString('base64')),
                      filename: message.filename || `media_${message.id}.${this.getFileExtension(message.mimetype)}`,
                      size: decryptedMedia.length
                    };
                  }
                } catch (decryptError) {
                  console.log(`⚠️ decryptFile falhou: ${decryptError.message}`);
                }
              }

              // MÉTODO 3: Se ainda não temos dados, tentar getFileFromMessage (se existir)
              if (!mediaData || !mediaData.data) {
                try {
                  if (typeof this.client.getFileFromMessage === 'function') {
                    console.log(`🔄 Tentando getFileFromMessage...`);
                    const fileData = await this.client.getFileFromMessage(message);
                    if (fileData && fileData.data) {
                      mediaData = fileData;
                      console.log(`✅ getFileFromMessage sucesso: ${fileData.data.length} caracteres`);
                    }
                  }
                } catch (fileError) {
                  console.log(`⚠️ getFileFromMessage falhou: ${fileError.message}`);
                }
              }

              // Aplicar dados se obtidos
              if (mediaData && mediaData.data) {
                // Verificar se o arquivo é muito pequeno (provavelmente thumbnail)
                const estimatedSize = Math.round(mediaData.data.length * 0.75);
                if (estimatedSize < 5000 && message.type === 'image') {
                  console.log(`⚠️ Arquivo muito pequeno (${estimatedSize} bytes), pode ser thumbnail`);
                  console.log(`🔄 Tentando métodos alternativos para obter qualidade original...`);
                  
                  // Tentar downloadMedia sem cache
                  try {
                    const freshMedia = await this.client.downloadMedia(message, false);
                    if (freshMedia && freshMedia.data && freshMedia.data.length > mediaData.data.length) {
                      console.log(`✅ Método alternativo retornou arquivo maior: ${freshMedia.data.length} caracteres`);
                      mediaData = freshMedia;
                    }
                  } catch (altError) {
                    console.log(`⚠️ Método alternativo falhou: ${altError.message}`);
                  }
                }
                
                mediaInfo.url = mediaData.data;
                mediaInfo.mimetype = mediaData.mimetype;
                mediaInfo.filename = mediaData.filename;
                mediaInfo.size = mediaData.size;
                console.log(`✅ Mídia obtida com sucesso: ${mediaData.data.length} caracteres base64 (${Math.round(mediaData.data.length * 0.75)} bytes estimados)`);
              } else {
                console.log(`❌ Nenhum método conseguiu obter a mídia`);
              }
            } catch (downloadError) {
              console.log(`⚠️ Erro geral ao baixar mídia: ${downloadError.message}`);
            }
          }
          
          // Fallback: verificar se a mensagem tem dados de mídia
          if (!mediaInfo.url && message.mediaData && message.mediaData.data) {
            mediaInfo.url = message.mediaData.data;
            mediaInfo.mimetype = message.mediaData.mimetype;
            mediaInfo.filename = message.mediaData.filename;
            mediaInfo.size = message.mediaData.size;
          }
          
          // Fallback: se o body contém dados base64 (mídia não processada)
          if (!mediaInfo.url && message.body && message.body.length > 100) {
            mediaInfo.url = message.body;
            mediaInfo.mimetype = this.getMimeTypeFromBase64(message.body);
            mediaInfo.type = this.detectMediaTypeFromBase64(message.body);
            mediaInfo.filename = `media_${message.id}.${this.getFileExtension(mediaInfo.mimetype)}`;
            mediaInfo.size = message.body.length;
          }
        } catch (error) {
          console.log(`⚠️ Erro ao obter mídia: ${error.message}`);
          // Se falhar, tentar usar dados do body como fallback
          if (message.body && message.body.length > 100) {
            mediaInfo.url = message.body;
            mediaInfo.mimetype = this.getMimeTypeFromBase64(message.body);
            mediaInfo.type = this.detectMediaTypeFromBase64(message.body);
            mediaInfo.filename = `media_${message.id}.${this.getFileExtension(mediaInfo.mimetype)}`;
            mediaInfo.size = message.body.length;
          }
        }
      }

      // Salvar no cache
      this.mediaCache.set(message.id, mediaInfo);
      
      return mediaInfo;
    } catch (error) {
      console.error('❌ Erro ao obter informações de mídia:', error);
      const errorInfo = {
        type: message.type,
        hasMedia: true,
        error: error.message
      };
      
      // Salvar erro no cache também para evitar reprocessar
      this.mediaCache.set(message.id, errorInfo);
      
      return errorInfo;
    }
  }

  // Enviar mídia usando cliente WPPConnect diretamente
  async sendMedia(to, mediaBuffer, filename, mimetype, caption = '') {
    try {
      console.log(`📤 Iniciando envio de mídia para ${to}: ${filename} (${mimetype})`);
      
      if (!this.client) {
        console.log('❌ Cliente WPPConnect não está inicializado');
        return {
          success: false,
          error: 'Cliente WPPConnect não está inicializado'
        };
      }
      
      if (!this.isConnected) {
        console.log('❌ WhatsApp não está conectado');
        return {
          success: false,
          error: 'WhatsApp não está conectado'
        };
      }

      // Converter buffer para base64
      const base64Media = mediaBuffer.toString('base64');
      console.log(`📊 Buffer original: ${mediaBuffer.length} bytes`);
      console.log(`📊 Base64 gerado: ${base64Media.length} caracteres`);
      console.log(`📊 Tamanho estimado do arquivo: ${Math.round(base64Media.length * 0.75)} bytes`);
      
      let result;

      // Usar métodos do cliente WPPConnect baseado no tipo de mídia
      if (mimetype.startsWith('image/')) {
        console.log('🖼️ Enviando imagem...');
        try {
          // Método 1: sendImage com data URL
          result = await this.client.sendImage(
            to, 
            `data:${mimetype};base64,${base64Media}`, 
            filename, 
            caption
          );
        } catch (imageError) {
          console.log(`⚠️ sendImage falhou: ${imageError.message}`);
          // Método 2: sendFile como fallback
          try {
            result = await this.client.sendFile(
              to,
              `data:${mimetype};base64,${base64Media}`,
              filename,
              caption
            );
          } catch (fileError) {
            console.log(`⚠️ sendFile também falhou: ${fileError.message}`);
            // Método 3: sendMessage com mídia
            try {
              result = await this.client.sendMessage(
                to,
                {
                  media: `data:${mimetype};base64,${base64Media}`,
                  caption: caption,
                  filename: filename
                }
              );
            } catch (messageError) {
              console.log(`⚠️ sendMessage também falhou: ${messageError.message}`);
              throw imageError; // Relançar o erro original
            }
          }
        }
      } else if (mimetype.startsWith('video/')) {
        console.log('🎥 Enviando vídeo...');
        result = await this.client.sendFile(
          to, 
          `data:${mimetype};base64,${base64Media}`, 
          filename, 
          caption
        );
      } else if (mimetype.startsWith('audio/')) {
        console.log('🎵 Enviando áudio...');
        result = await this.client.sendVoice(
          to, 
          `data:${mimetype};base64,${base64Media}`
        );
      } else {
        console.log('📄 Enviando documento...');
        result = await this.client.sendFile(
          to, 
          `data:${mimetype};base64,${base64Media}`, 
          filename, 
          caption
        );
      }

      console.log('📤 Resultado do WPPConnect:', result);

      if (result && result.id) {
        console.log(`✅ Mídia enviada com sucesso: ${result.id}`);
        return {
          success: true,
          data: {
            messageId: result.id,
            timestamp: result.timestamp || Date.now()
          }
        };
      } else {
        console.log('❌ Resposta inválida do WhatsApp:', result);
        throw new Error('Resposta inválida do WhatsApp');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mídia:', error);
      console.error('❌ Stack trace:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
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
