// Evolution API Mock - Simula comportamento da Evolution API localmente
class EvolutionApiMock {
  constructor() {
    this.instanceName = 'whatsapp-crm-instance';
    this.instances = new Map();
    
    console.log('🎭 Evolution API Mock inicializado');
    console.log(`📱 Instância padrão: ${this.instanceName}`);
  }

  // Simular delay de rede
  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Gerar QR Code fake
  generateFakeQRCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 200; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `2@${result}`;
  }

  // Criar instância
  async createInstance() {
    try {
      console.log(`🏗️ [MOCK] Criando instância: ${this.instanceName}`);
      await this.delay(500);
      
      // Simular criação de instância
      this.instances.set(this.instanceName, {
        name: this.instanceName,
        state: 'close',
        qrcode: null,
        owner: null,
        createdAt: new Date().toISOString()
      });

      console.log('✅ [MOCK] Instância criada com sucesso');
      return {
        success: true,
        data: {
          instance: {
            instanceName: this.instanceName,
            status: 'created'
          }
        }
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao criar instância:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Conectar instância (obter QR Code)
  async connectInstance() {
    try {
      console.log(`🔌 [MOCK] Conectando instância: ${this.instanceName}`);
      await this.delay(800);
      
      const instance = this.instances.get(this.instanceName);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      // Simular geração de QR code
      const qrCode = this.generateFakeQRCode();
      instance.state = 'qrcode';
      instance.qrcode = { code: qrCode };

      console.log('✅ [MOCK] QR Code gerado');
      return {
        success: true,
        data: {
          instance: {
            instanceName: this.instanceName,
            qrcode: { code: qrCode },
            state: 'qrcode'
          }
        }
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao conectar instância:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter status da instância
  async getInstanceStatus() {
    try {
      await this.delay(200);
      
      const instance = this.instances.get(this.instanceName);
      
      if (!instance) {
        return {
          success: true,
          data: {
            status: 'disconnected',
            isReady: false,
            qrCode: null,
            phone: null,
            instanceName: this.instanceName
          }
        };
      }

      const mappedStatus = {
        status: this.mapStatus(instance.state),
        isReady: instance.state === 'open',
        qrCode: instance.qrcode?.code || null,
        phone: instance.owner?.id || null,
        instanceName: this.instanceName
      };

      return {
        success: true,
        data: mappedStatus
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao obter status:', error.message);
      return {
        success: false,
        error: error.message,
        data: {
          status: 'disconnected',
          isReady: false,
          qrCode: null,
          phone: null,
          instanceName: this.instanceName
        }
      };
    }
  }

  // Simular conexão após QR code ser "escaneado"
  async simulateConnection() {
    console.log('📱 [MOCK] Simulando conexão após QR code...');
    
    const instance = this.instances.get(this.instanceName);
    if (instance && instance.state === 'qrcode') {
      await this.delay(2000);
      
      instance.state = 'open';
      instance.qrcode = null;
      instance.owner = { id: '5511999999999' };
      
      console.log('✅ [MOCK] Instância conectada!');
      return true;
    }
    
    return false;
  }

  // Mapear status
  mapStatus(evolutionStatus) {
    switch (evolutionStatus) {
      case 'open':
        return 'connected';
      case 'connecting':
        return 'connecting';
      case 'qrcode':
        return 'qr_ready';
      case 'close':
      default:
        return 'disconnected';
    }
  }

  // Obter conversas (mock)
  async getChats() {
    try {
      console.log(`💬 [MOCK] Obtendo conversas: ${this.instanceName}`);
      await this.delay(1000);
      
      const instance = this.instances.get(this.instanceName);
      if (!instance || instance.state !== 'open') {
        return {
          success: false,
          error: 'WhatsApp não está conectado',
          data: []
        };
      }

      // Dados mock de conversas
      const mockChats = [
        {
          id: '5511999999999@c.us',
          name: 'João Silva',
          lastMessage: 'Olá! Como posso ajudar?',
          timestamp: new Date().toISOString(),
          unreadCount: 2
        },
        {
          id: '5511888888888@c.us',
          name: 'Maria Santos',
          lastMessage: 'Obrigada pelo atendimento!',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0
        }
      ];
      
      console.log(`✅ [MOCK] ${mockChats.length} conversas encontradas`);
      return {
        success: true,
        data: mockChats
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao obter conversas:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Obter mensagens de uma conversa (mock)
  async getChatMessages(chatId, limit = 50) {
    try {
      console.log(`📱 [MOCK] Obtendo mensagens do chat: ${chatId}`);
      await this.delay(800);
      
      const instance = this.instances.get(this.instanceName);
      if (!instance || instance.state !== 'open') {
        return {
          success: false,
          error: 'WhatsApp não está conectado',
          data: []
        };
      }

      // Dados mock de mensagens
      const mockMessages = [
        {
          id: 'msg1',
          from: chatId,
          to: 'me',
          body: 'Olá! Gostaria de saber mais sobre seus serviços.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'text',
          fromMe: false
        },
        {
          id: 'msg2',
          from: 'me',
          to: chatId,
          body: 'Olá! Claro, posso te ajudar. Que tipo de serviço você procura?',
          timestamp: new Date(Date.now() - 7000000).toISOString(),
          type: 'text',
          fromMe: true
        },
        {
          id: 'msg3',
          from: chatId,
          to: 'me',
          body: 'Preciso de um sistema de CRM para minha empresa.',
          timestamp: new Date(Date.now() - 6800000).toISOString(),
          type: 'text',
          fromMe: false
        }
      ];
      
      console.log(`✅ [MOCK] ${mockMessages.length} mensagens encontradas`);
      return {
        success: true,
        data: mockMessages.slice(0, limit)
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao obter mensagens:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Enviar mensagem (mock)
  async sendMessage(to, message) {
    try {
      console.log(`📤 [MOCK] Enviando mensagem para: ${to}`);
      await this.delay(1200);
      
      const instance = this.instances.get(this.instanceName);
      if (!instance || instance.state !== 'open') {
        return {
          success: false,
          error: 'WhatsApp não está conectado'
        };
      }
      
      const mockResponse = {
        id: `msg_${Date.now()}`,
        to: to,
        body: message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      
      console.log('✅ [MOCK] Mensagem enviada com sucesso');
      return {
        success: true,
        data: mockResponse
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao enviar mensagem:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Deletar instância
  async deleteInstance() {
    try {
      console.log(`🗑️ [MOCK] Deletando instância: ${this.instanceName}`);
      await this.delay(500);
      
      this.instances.delete(this.instanceName);
      
      console.log('✅ [MOCK] Instância deletada');
      return {
        success: true,
        data: { message: 'Instância deletada com sucesso' }
      };
    } catch (error) {
      console.error('❌ [MOCK] Erro ao deletar instância:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    await this.delay(100);
    return {
      success: true,
      data: { 
        status: 'OK', 
        service: 'Evolution API Mock',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    };
  }

  // Método para simular auto-conexão após 10 segundos (para demo)
  startAutoConnect() {
    setTimeout(async () => {
      const instance = this.instances.get(this.instanceName);
      if (instance && instance.state === 'qrcode') {
        console.log('🤖 [MOCK] Auto-conectando instância para demonstração...');
        await this.simulateConnection();
      }
    }, 10000); // 10 segundos após gerar QR code
  }
}

// Exportar instância única (Singleton)
module.exports = new EvolutionApiMock();
