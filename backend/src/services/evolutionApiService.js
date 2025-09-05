const axios = require('axios');

class EvolutionApiService {
  constructor() {
    // Configuração da Evolution API - usando container Docker local
    this.baseURL = process.env.EVOLUTION_API_URL || 'http://localhost:8081';
    this.apiKey = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
    this.instanceName = 'whatsapp-crm-instance';
    
    // Cliente HTTP configurado
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey
      },
      timeout: 30000
    });

    console.log('🚀 Evolution API Service inicializado');
    console.log(`📍 Base URL: ${this.baseURL}`);
    console.log(`🔑 API Key: ${this.apiKey.substring(0, 10)}...`);
  }

  // Criar instância
  async createInstance() {
    try {
      console.log(`🏗️ Criando instância: ${this.instanceName}`);
      
      const response = await this.client.post('/instance/create', {
        instanceName: this.instanceName,
        token: this.instanceName,
        qrcode: true,
        integration: 'EVOLUTION'
      });

      console.log('✅ Instância criada:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Conectar instância (obter QR Code)
  async connectInstance() {
    try {
      console.log(`🔌 Conectando instância: ${this.instanceName}`);
      
      const response = await this.client.get(`/instance/connect/${this.instanceName}`);
      
      console.log('✅ Instância conectando:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao conectar instância:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Obter status da instância
  async getInstanceStatus() {
    try {
      const response = await this.client.get('/instance/fetchInstances');
      
      // Procurar nossa instância na lista
      const instances = Array.isArray(response.data) ? response.data : [];
      const ourInstance = instances.find(inst => inst.name === this.instanceName);
      
      if (!ourInstance) {
        return {
          success: false,
          error: 'Instance not found',
          data: {
            status: 'disconnected',
            isReady: false,
            qrCode: null,
            phone: null,
            instanceName: this.instanceName
          }
        };
      }
      
      // Mapear status da Evolution API para nosso formato
      const mappedStatus = {
        status: this.mapStatus(ourInstance.connectionStatus),
        isReady: ourInstance.connectionStatus === 'open',
        qrCode: ourInstance.qrcode || null,
        phone: ourInstance.number || null,
        instanceName: this.instanceName
      };

      return {
        success: true,
        data: mappedStatus
      };
    } catch (error) {
      console.error('❌ Erro ao obter status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
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

  // Mapear status da Evolution API para nosso formato
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

  // Obter conversas
  async getChats() {
    try {
      // Como sabemos que as rotas da Evolution API ainda não estão funcionando,
      // vamos retornar dados de demonstração diretamente para evitar spam de logs
      console.log('📝 Carregando conversas de demonstração (Evolution API endpoints não disponíveis)');
      
      const mockChats = [
        {
          id: '5511999999999@c.us',
          name: 'João Silva',
          isGroup: false,
          lastMessage: {
            body: 'Olá! Gostaria de saber mais sobre seus produtos.',
            timestamp: Date.now() / 1000 - 300, // 5 minutos atrás
            from: '5511999999999@c.us'
          },
          unreadCount: 2
        },
        {
          id: '5511888888888@c.us',
          name: 'Maria Santos',
          isGroup: false,
          lastMessage: {
            body: 'Obrigada pelo atendimento!',
            timestamp: Date.now() / 1000 - 1800, // 30 minutos atrás
            from: '5511888888888@c.us'
          },
          unreadCount: 0
        },
        {
          id: '120363043211234567@g.us',
          name: 'Grupo Vendas',
          isGroup: true,
          lastMessage: {
            body: 'Reunião às 15h hoje!',
            timestamp: Date.now() / 1000 - 3600, // 1 hora atrás
            from: '5511777777777@c.us'
          },
          unreadCount: 5
        },
        {
          id: '5511666666666@c.us',
          name: 'Pedro Costa',
          isGroup: false,
          lastMessage: {
            body: 'Quando vocês abrem?',
            timestamp: Date.now() / 1000 - 7200, // 2 horas atrás
            from: '5511666666666@c.us'
          },
          unreadCount: 1
        }
      ];
      
      return {
        success: true,
        data: mockChats
      };
    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error.message);
      return {
        success: true,
        data: []
      };
    }
  }

  // Obter mensagens de uma conversa
  async getChatMessages(chatId, limit = 50) {
    try {
      console.log(`📱 Carregando mensagens de demonstração para: ${chatId.substring(0, 20)}...`);
      
      // Gerar mensagens de demonstração baseadas no chatId para simular conversas diferentes
      const isGroup = chatId.includes('@g.us');
      const contactName = this.getContactName(chatId);
      
      const mockMessages = [
        {
          id: `msg-${chatId}-1`,
          body: isGroup ? 
            `Olá pessoal! Como estão as vendas hoje?` :
            `Olá! Gostaria de saber mais sobre seus produtos.`,
          timestamp: Date.now() / 1000 - 3600, // 1 hora atrás
          from: chatId,
          to: `${this.instanceName}@c.us`,
          isFromMe: false,
          type: 'text'
        },
        {
          id: `msg-${chatId}-2`,
          body: isGroup ?
            `Bom dia! Vamos revisar as metas da semana.` :
            `Olá! Claro, vou te passar todas as informações.`,
          timestamp: Date.now() / 1000 - 3000, // 50 minutos atrás
          from: `${this.instanceName}@c.us`,
          to: chatId,
          isFromMe: true,
          type: 'text'
        },
        {
          id: `msg-${chatId}-3`,
          body: isGroup ?
            `Perfeito! Vamos focar nos leads quentes.` :
            `Obrigado! Quando posso passar na loja?`,
          timestamp: Date.now() / 1000 - 1800, // 30 minutos atrás
          from: chatId,
          to: `${this.instanceName}@c.us`,
          isFromMe: false,
          type: 'text'
        },
        {
          id: `msg-${chatId}-4`,
          body: isGroup ?
            `Vou enviar o relatório por e-mail.` :
            `Funcionamos de segunda a sexta, das 9h às 18h. Será bem-vindo!`,
          timestamp: Date.now() / 1000 - 900, // 15 minutos atrás
          from: `${this.instanceName}@c.us`,
          to: chatId,
          isFromMe: true,
          type: 'text'
        }
      ];
      
      return {
        success: true,
        data: mockMessages
      };
    } catch (error) {
      console.error('❌ Erro ao obter mensagens:', error.message);
      return {
        success: true,
        data: []
      };
    }
  }

  // Função auxiliar para obter nome do contato baseado no ID
  getContactName(chatId) {
    const nameMap = {
      '5511999999999@c.us': 'João Silva',
      '5511888888888@c.us': 'Maria Santos',
      '5511666666666@c.us': 'Pedro Costa',
      '120363043211234567@g.us': 'Grupo Vendas'
    };
    return nameMap[chatId] || 'Contato';
  }

  // Enviar mensagem
  async sendMessage(to, message) {
    try {
      console.log(`📤 Enviando mensagem para: ${to}`);
      
      const response = await this.client.post(`/message/sendText/${this.instanceName}`, {
        number: to,
        text: message
      });
      
      console.log('✅ Mensagem enviada:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Deletar instância
  async deleteInstance() {
    try {
      console.log(`🗑️ Deletando instância: ${this.instanceName}`);
      
      const response = await this.client.delete(`/instance/delete/${this.instanceName}`);
      
      console.log('✅ Instância deletada:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Health check da Evolution API
  async healthCheck() {
    try {
      const response = await this.client.get('/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Exportar instância única (Singleton)
module.exports = new EvolutionApiService();
