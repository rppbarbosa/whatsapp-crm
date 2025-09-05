const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.phone = null;
    this.status = 'disconnected';
    this.authPath = path.join(__dirname, '../../auth_info');
    
    // Criar diretório de autenticação se não existir
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
  }

  async initialize() {
    try {
      console.log('🚀 Inicializando WhatsApp Service...');
      
      // Limpar instância anterior se existir
      if (this.client) {
        await this.destroy();
      }

      // Criar cliente
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsapp-crm',
          dataPath: this.authPath
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      this.setupEvents();
      
      console.log('🔌 Inicializando cliente WhatsApp...');
      await this.client.initialize();
      
      return { success: true, message: 'WhatsApp Service inicializado' };
    } catch (error) {
      console.error('❌ Erro ao inicializar WhatsApp Service:', error);
      return { success: false, error: error.message };
    }
  }

  setupEvents() {
    console.log('🔌 Configurando eventos do WhatsApp...');

    // QR Code
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code recebido');
      this.qrCode = qr;
      this.status = 'qr_ready';
      this.isReady = false;
    });

    // Cliente pronto
    this.client.on('ready', () => {
      console.log('✅ WhatsApp conectado e pronto!');
      this.isReady = true;
      this.status = 'connected';
      this.qrCode = null;
      
      // Obter informações do cliente
      if (this.client.info) {
        this.phone = this.client.info.wid.user;
        console.log(`📱 Número: ${this.phone}`);
      }
    });

    // Cliente desconectado
    this.client.on('disconnected', (reason) => {
      console.log(`❌ WhatsApp desconectado: ${reason}`);
      this.isReady = false;
      this.status = 'disconnected';
      this.phone = null;
    });

    // Erro
    this.client.on('error', (error) => {
      console.error('❌ Erro no WhatsApp:', error);
      this.status = 'error';
    });

    // Mudança de estado
    this.client.on('change_state', (state) => {
      console.log(`🔄 Estado mudou para: ${state}`);
    });

    // Autenticado
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp autenticado');
    });

    // Falha na autenticação
    this.client.on('auth_failure', (msg) => {
      console.log('❌ Falha na autenticação:', msg);
    });

    // Mensagem recebida
    this.client.on('message', async (message) => {
      console.log('📨 Mensagem recebida:', message.body);
      // Aqui você pode processar mensagens recebidas
    });
  }

  getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      qrCode: this.qrCode,
      phone: this.phone
    };
  }

  async sendMessage(to, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const result = await this.client.sendMessage(to, message);
      console.log('✅ Mensagem enviada:', result.id._serialized);
      return { success: true, messageId: result.id._serialized };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async getChats() {
    if (!this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chats = await this.client.getChats();
      return chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user,
        isGroup: chat.isGroup,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp,
          from: chat.lastMessage.from
        } : null,
        unreadCount: chat.unreadCount
      }));
    } catch (error) {
      console.error('❌ Erro ao obter chats:', error);
      throw error;
    }
  }

  async getMessages(chatId, limit = 50) {
    if (!this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(message => ({
        id: message.id._serialized,
        body: message.body,
        timestamp: message.timestamp,
        from: message.from,
        to: message.to,
        isFromMe: message.fromMe,
        type: message.type
      }));
    } catch (error) {
      console.error('❌ Erro ao obter mensagens:', error);
      throw error;
    }
  }

  async destroy() {
    if (this.client) {
      try {
        await this.client.destroy();
        console.log('✅ Cliente WhatsApp destruído');
      } catch (error) {
        console.error('❌ Erro ao destruir cliente:', error);
      }
      this.client = null;
    }
    
    this.isReady = false;
    this.status = 'disconnected';
    this.qrCode = null;
    this.phone = null;
  }
}

module.exports = new WhatsAppService(); 
module.exports = new WhatsAppService(); 