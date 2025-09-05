const { Client, LocalAuth } = require('whatsapp-web.js');
const { supabaseAdmin } = require('./supabase');
const path = require('path');
const fs = require('fs');

class WhatsAppWebService {
  constructor() {
    this.instance = null;
    this.isCreating = false; // 🔒 Lock de criação
    this.creationPromise = null; // 🔒 Promise única de criação
    this.authPath = path.join(__dirname, '../../auth_info');
    
    // Criar diretório de autenticação se não existir
    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }
  }

  // Criar nova instância (substitui a anterior)
  async createInstance(instanceName) {
    try {
      console.log(`🚀 Criando instância WhatsApp Web: ${instanceName}`);
      
      // 🔒 Prevenir criação múltipla
      if (this.isCreating) {
        console.log('⏳ Instância já está sendo criada, aguarde...');
        return this.creationPromise;
      }

      // 🔒 Verificar se instância já existe e está ativa
      if (this.instance && this.instance.instanceName === instanceName) {
        if (this.instance.status === 'connected') {
          console.log('ℹ️ Instância já existe e está conectada');
          return { success: true, message: 'Instância já está conectada', instanceName };
        } else if (this.instance.status === 'qr_ready') {
          console.log('ℹ️ Instância já existe e está aguardando QR code');
          return { success: true, message: 'Instância aguardando QR code', instanceName };
        }
      }
      
      this.isCreating = true;
      this.creationPromise = this._createInstanceInternal(instanceName);
      
      try {
        const result = await this.creationPromise;
        return result;
      } finally {
        this.isCreating = false;
        this.creationPromise = null;
      }
      
    } catch (error) {
      this.isCreating = false;
      this.creationPromise = null;
      console.error('❌ Erro ao criar instância:', error);
      
      return {
        success: false,
        message: 'Erro ao criar instância',
        error: error.message
      };
    }
  }

  // Método interno para criação da instância
  async _createInstanceInternal(instanceName, userId = null) {
    try {
      // Se já existe uma instância, parar ela
      if (this.instance) {
        console.log('🔄 Parando instância anterior...');
        await this.stopInstance();
        
        // Aguardar um pouco para garantir que a instância anterior foi fechada
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 🔒 CORREÇÃO CRÍTICA: Criar diretório de autenticação específico para o usuário
      const userAuthPath = userId 
        ? path.join(this.authPath, `user_${userId}`, instanceName)
        : path.join(this.authPath, instanceName);
      
      // Criar diretório se não existir
      if (!fs.existsSync(userAuthPath)) {
        fs.mkdirSync(userAuthPath, { recursive: true });
      }

      // Configurar cliente WhatsApp Web seguindo a documentação oficial
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: instanceName,
          dataPath: userAuthPath
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
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-networking',
            '--disable-sync-preferences',
            '--disable-background-media-suspend',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-client-side-phishing-detection',
            '--disable-threaded-animation',
            '--disable-threaded-scrolling',
            '--disable-in-process-stack-traces',
            '--disable-histogram-customizer',
            '--disable-gl-extensions',
            '--disable-composited-antialiasing',
            '--disable-canvas-aa',
            '--disable-3d-apis',
            '--disable-accelerated-layers',
            '--disable-accelerated-plugins',
            '--disable-accelerated-video',
            '--disable-accelerated-video-decode',
            '--disable-gpu-sandbox',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote'
          ],
          timeout: 60000,
          protocolTimeout: 60000,
          ignoreDefaultArgs: ['--disable-extensions'],
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false
        }
      });

      // Configurar timeouts mais longos
      client.setMaxListeners(20);
      
      // 🔒 CORREÇÃO CRÍTICA: Salvar instância ANTES de configurar eventos
      this.instance = {
        client,
        instanceName,
        userId, // 🔒 Vincular ao usuário
        status: 'connecting',
        phone: null,
        qrCode: null,
        createdAt: new Date(),
        isAuthenticated: false,
        authPath: userAuthPath // 🔒 Caminho específico do usuário
      };
      
      console.log(`🔌 Cliente WhatsApp Web criado para ${instanceName} (Usuário: ${userId || 'Sistema'})`);
      
      // 🔒 AGORA configurar eventos DEPOIS de salvar a instância
      this.setupEvents(client, instanceName);
      
      // Inicializar cliente
      console.log('🔌 Inicializando cliente WhatsApp Web...');
      await client.initialize();
      
      // Aguardar um pouco para estabilizar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Salvar no banco de dados com vínculo ao usuário
      await this.saveInstanceToDatabase(instanceName, 'connecting', userId);
      
      return {
        success: true,
        message: 'Instância criada com sucesso',
        instanceName,
        userId
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      
      // Limpar recursos em caso de erro
      if (this.instance && this.instance.client) {
        try {
          await this.instance.client.destroy();
        } catch (destroyError) {
          console.error('❌ Erro ao destruir cliente:', destroyError);
        }
      }
      
      this.instance = null;
      
      return {
        success: false,
        message: 'Erro ao criar instância',
        error: error.message
      };
    }
  }

  // Configurar eventos do cliente WhatsApp Web
  setupEvents(client, instanceName) {
    console.log(`🔌 Configurando eventos para instância: ${instanceName}`);

    // Evento: QR code recebido (seguindo documentação oficial)
    client.on('qr', async (qr) => {
      try {
        console.log(`📱 QR Code recebido para ${instanceName}: ${qr.substring(0, 50)}...`);
        
        // Verificar se a instância ainda existe
        if (!this.instance || this.instance.instanceName !== instanceName) {
          console.log('⚠️ Instância não encontrada para QR code, ignorando evento');
          return;
        }
        
        // Processar QR code
        await this.processQRCode(instanceName, qr);
        
      } catch (error) {
        console.error('❌ Erro ao processar QR code:', error);
      }
    });

    // 🔍 DEBUG: Adicionar logs para todos os eventos do cliente
    client.on('authenticated', () => {
      console.log(`🔐 Cliente autenticado para ${instanceName}`);
      console.log(`🔍 DEBUG: Estado atual do cliente: ${client.state}`);
      console.log(`🔍 DEBUG: Cliente tem info? ${client.info ? 'SIM' : 'NÃO'}`);
      
      // Verificar se o cliente está pronto após autenticação
      setTimeout(async () => {
        console.log(`🔍 DEBUG: Verificando estado após autenticação...`);
        console.log(`🔍 DEBUG: Estado: ${client.state}`);
        console.log(`🔍 DEBUG: Info disponível: ${client.info ? 'SIM' : 'NÃO'}`);
        
        if (client.state === 'CONNECTED' && client.info) {
          console.log(`🚀 DEBUG: Cliente está pronto, disparando ready manualmente...`);
          // Simular evento ready
          try {
            await this.handleReadyEvent(instanceName, client);
          } catch (error) {
            console.error('❌ Erro ao processar ready manual:', error);
          }
        }
      }, 3000); // Aguardar 3 segundos
    });

    client.on('auth_failure', (msg) => {
      console.log(`❌ Falha na autenticação para ${instanceName}:`, msg);
    });

    client.on('change_state', (state) => {
      console.log(`🔄 Estado do cliente mudou para ${instanceName}:`, state);
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Carregando ${instanceName}: ${percent}% - ${message}`);
    });

    // Evento: Cliente pronto (conectado) - seguindo documentação oficial
    client.on('ready', async () => {
      console.log(`🎉 Evento 'ready' disparado para ${instanceName}`);
      await this.handleReadyEvent(instanceName, client);
    });

    // Evento: Cliente desconectado - seguindo documentação oficial
    client.on('disconnected', async (reason) => {
      try {
        console.log(`❌ WhatsApp Web desconectado para ${instanceName}: ${reason}`);
        
        // Verificar se a instância ainda existe
        if (!this.instance || this.instance.instanceName !== instanceName) {
          console.log('⚠️ Instância não encontrada para disconnected, ignorando evento');
          return;
        }
        
        // Atualizar status da instância
        this.instance.status = 'disconnected';
        this.instance.qrCode = null;
        this.instance.phone = null;
        this.instance.isAuthenticated = false;
        
        // Salvar status no banco
        await this.updateInstanceStatus(instanceName, 'disconnected');
        
        // Notificar clientes WebSocket
        if (global.io) {
          global.io.to(instanceName).emit('instance_disconnected', {
            instanceName,
            reason,
            timestamp: new Date().toISOString()
          });
          console.log('📡 WebSocket: Desconexão notificada para clientes');
        }
        
        // Parar sincronização automática
        this.stopAutoSync(instanceName);
      } catch (error) {
        console.error('❌ Erro ao processar evento disconnected:', error);
      }
    });

    // Evento: Erro no cliente
    client.on('error', async (error) => {
      try {
        console.error(`❌ Erro no WhatsApp Web para ${instanceName}:`, error);
        
        // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar se a instância ainda existe
        if (!this.instance || this.instance.instanceName !== instanceName) {
          console.log('⚠️ Instância não encontrada para error, ignorando evento');
          return;
        }
        
        // Atualizar status da instância
        this.instance.status = 'error';
        
        // Salvar erro no banco
        await this.saveErrorToDatabase(instanceName, error);
        
        // Notificar clientes WebSocket
        if (global.io) {
          global.io.to(instanceName).emit('instance_error', {
            instanceName,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          console.log('📡 WebSocket: Erro notificado para clientes');
        }
      } catch (processError) {
        console.error('❌ Erro ao processar evento error:', processError);
      }
    });

    // Evento: Mensagem recebida
    client.on('message', async (message) => {
      try {
        console.log(`📨 Mensagem recebida de ${message.from}: ${message.body?.substring(0, 50)}...`);
        
        // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar se a instância ainda existe
        if (!this.instance || this.instance.instanceName !== instanceName) {
          console.log('⚠️ Instância não encontrada para message, ignorando evento');
          return;
        }
        
        // Salvar mensagem no banco
        const messageService = require('./messageService');
        await messageService.saveReceivedMessage(instanceName, message);
        
        // Criar/atualizar conversa automaticamente
        await this.createOrUpdateConversation(instanceName, message);
        
        // Notificar clientes WebSocket
        if (global.io) {
          global.io.to(instanceName).emit('message_received', {
            instanceName,
            message: {
              id: message.key.id,
              from: message.from,
              body: message.body,
              timestamp: message.timestamp,
              type: message.type
            },
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem recebida:', error);
      }
    });

    // Evento: Mensagem enviada
    client.on('message_create', async (message) => {
      try {
        if (message.fromMe) {
          console.log(`📤 Mensagem enviada para ${message.to}: ${message.body?.substring(0, 50)}...`);
          
          // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar se a instância ainda existe
          if (!this.instance || this.instance.instanceName !== instanceName) {
            console.log('⚠️ Instância não encontrada para message_create, ignorando evento');
            return;
          }
          
          // Salvar mensagem no banco
          const messageService = require('./messageService');
          await messageService.saveReceivedMessage(instanceName, message);
          
          // Notificar clientes WebSocket
          if (global.io) {
            global.io.to(instanceName).emit('message_sent', {
              instanceName,
              message: {
                id: message.key.id,
                to: message.to,
                body: message.body,
                timestamp: message.timestamp,
                type: message.type
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem enviada:', error);
      }
    });

    // Evento: Confirmação de mensagem
    client.on('message_ack', async (message, ack) => {
      try {
        console.log(`✅ Confirmação de mensagem ${message.key.id}: ${ack}`);
        
        // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar se a instância ainda existe
        if (!this.instance || this.instance.instanceName !== instanceName) {
          console.log('⚠️ Instância não encontrada para message_ack, ignorando evento');
          return;
        }
        
        // Atualizar status da mensagem no banco
        const messageService = require('./messageService');
        await messageService.updateMessageStatus(instanceName, message.key.id, ack);
        
        // Notificar clientes WebSocket
        if (global.io) {
          global.io.to(instanceName).emit('message_ack', {
            instanceName,
            messageId: message.key.id,
            ack,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Erro ao processar confirmação de mensagem:', error);
      }
    });

    console.log(`✅ Eventos configurados para instância: ${instanceName}`);
  }

  // Método para processar evento ready (chamado pelo evento ou manualmente)
  async handleReadyEvent(instanceName, client) {
    try {
      console.log(`✅ WhatsApp Web conectado para ${instanceName}`);
      
      // Verificar se a instância ainda existe
      if (!this.instance || this.instance.instanceName !== instanceName) {
        console.log('⚠️ Instância não encontrada para ready, ignorando evento');
        return;
      }
      
      // Atualizar status da instância
      this.instance.status = 'connected';
      this.instance.qrCode = null;
      this.instance.isAuthenticated = true;
      
      // Obter informações do cliente
      try {
        const info = client.info;
        this.instance.phone = info.wid.user;
        console.log(`📱 Número do telefone: ${this.instance.phone}`);
      } catch (phoneError) {
        console.error('❌ Erro ao obter número do telefone:', phoneError);
      }
      
      // Salvar status no banco
      await this.updateInstanceStatus(instanceName, 'connected');
      
      // Notificar clientes WebSocket (desabilitado por enquanto)
      // if (global.io) {
      //   global.io.to(instanceName).emit('instance_connected', {
      //     instanceName,
      //     phone: this.instance.phone,
      //     status: 'connected',
      //     isAuthenticated: true,
      //     timestamp: new Date().toISOString()
      //   });
      //   console.log('📡 WebSocket: Conexão notificada para clientes');
      // }
      
      // Iniciar sincronização automática
      console.log(`🔄 Iniciando sincronização para ${instanceName}...`);
      this.startAutoSync(instanceName, client);
    } catch (error) {
      console.error('❌ Erro ao processar evento ready:', error);
    }
  }

  // Obter status da instância
  getInstanceStatus() {
    if (!this.instance) {
      return null;
    }

    // Verificar estado real do cliente
    if (this.instance.client) {
      // Se o cliente está pronto mas nosso status não reflete isso
      if (this.instance.client.state === 'CONNECTED' && this.instance.status !== 'connected') {
        console.log('⚠️ Cliente está conectado mas status não foi atualizado!');
        this.instance.status = 'connected';
        this.instance.isAuthenticated = true;
        
        // Tentar obter informações do cliente
        if (this.instance.client.info) {
          this.instance.phone = this.instance.client.info.wid.user;
          console.log(`📱 Número detectado: ${this.instance.phone}`);
        }
      }
    }

    return {
      instanceName: this.instance.instanceName,
      status: this.instance.status,
      phone: this.instance.phone,
      qrCode: this.instance.qrCode,
      isAuthenticated: this.instance.isAuthenticated,
      createdAt: this.instance.createdAt
    };
  }

  // Obter QR code
  async getQRCode() {
    if (!this.instance || this.instance.state !== 'qr_ready') {
      return null;
    }
    return this.instance.qrCode;
  }

  // Parar instância
  async stopInstance() {
    if (!this.instance) {
      console.log('ℹ️ Nenhuma instância ativa para parar');
      return;
    }

    try {
      console.log(`🛑 Parando instância ${this.instance.instanceName}...`);
      
      if (this.instance.client) {
        try {
          // Usar logout() em vez de destroy() para evitar problemas com arquivos
          console.log('🔌 Deslogando cliente WhatsApp Web...');
          
          if (this.instance.client.info) {
            try {
              await this.instance.client.logout();
              console.log('✅ Cliente deslogado com sucesso');
            } catch (logoutError) {
              console.log('⚠️ Erro no logout, tentando destroy:', logoutError.message);
              await this.instance.client.destroy();
            }
          } else {
            await this.instance.client.destroy();
          }
          
          console.log(`✅ Cliente WhatsApp Web destruído com sucesso`);
        } catch (destroyError) {
          console.error(`❌ Erro ao destruir cliente:`, destroyError);
          
          // Se falhar, tentar fechar o browser
          try {
            if (this.instance.client.pupBrowser && this.instance.client.pupBrowser.isConnected()) {
              await this.instance.client.pupBrowser.close();
              console.log(`✅ Browser fechado com sucesso`);
            }
          } catch (browserError) {
            console.error(`❌ Erro ao fechar browser:`, browserError);
          }
        }
      }
      
      // Atualizar status no banco (sem falhar se der erro)
      try {
        await this.updateInstanceStatus(this.instance.instanceName, 'disconnected');
      } catch (dbError) {
        console.error(`❌ Erro ao atualizar status no banco:`, dbError);
        // Não falhar por causa de erro de banco
      }
      
      // Limpar instância
      this.instance = null;
      console.log(`🛑 Instância parada com sucesso`);
      
    } catch (error) {
      console.error(`❌ Erro ao parar instância:`, error);
      
      // Forçar limpeza mesmo com erro
      this.instance = null;
    }
  }

  // Limpeza inteligente da instância (só fecha se não foi autenticada)
  async cleanupInstance(instanceName, force = false) {
    try {
      console.log(`🧹 Iniciando limpeza da instância: ${instanceName}`);
      
      // 🔒 VERIFICAÇÃO DE SEGURANÇA: Verificar se a instância existe
      if (!this.instance || this.instance.instanceName !== instanceName) {
        console.log('ℹ️ Instância não encontrada para limpeza');
        return { success: true, message: 'Instância não encontrada' };
      }
      
      // 🔒 REGRA IMPORTANTE: Só fechar se não foi autenticada OU se for forçado
      if (!force && this.instance.isAuthenticated) {
        console.log('✅ Instância autenticada, mantendo ativa');
        return { 
          success: true, 
          message: 'Instância autenticada mantida ativa',
          status: 'connected',
          phone: this.instance.phone
        };
      }
      
      // Se chegou aqui, pode fechar a instância
      console.log('🛑 Fechando instância para limpeza...');
      await this.stopInstance();
      
      return { success: true, message: 'Instância fechada com sucesso' };
      
    } catch (error) {
      console.error('❌ Erro durante limpeza da instância:', error);
      return { success: false, message: 'Erro durante limpeza', error: error.message };
    }
  }

  // Forçar fechamento da instância (mesmo se autenticada)
  async forceStopInstance(instanceName) {
    try {
      console.log(`🛑 Forçando parada da instância: ${instanceName}`);
      
      if (!this.instance || this.instance.instanceName !== instanceName) {
        console.log('ℹ️ Instância não encontrada para parada forçada');
        return { success: true, message: 'Instância não encontrada' };
      }
      
      await this.stopInstance();
      return { success: true, message: 'Instância parada forçadamente' };
      
    } catch (error) {
      console.error('❌ Erro ao forçar parada da instância:', error);
      return { success: false, message: 'Erro ao forçar parada', error: error.message };
    }
  }

  // Salvar instância no banco
  async saveInstanceToDatabase(instanceName, status, userId = null) {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .upsert({
          instance_name: instanceName,
          status: status,
          user_id: userId, // 🔒 Vincular ao usuário
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log(`💾 Instância ${instanceName} salva no banco`);
    } catch (error) {
      console.error(`❌ Erro ao salvar instância no banco:`, error);
    }
  }

  // Atualizar status da instância
  async updateInstanceStatus(instanceName, status, phone = null) {
    try {
      const updateData = {
        instance_name: instanceName,
        status,
        updated_at: new Date().toISOString()
      };

      if (phone) {
        updateData.phone_number = phone;
      }

      // Tentar upsert em vez de apenas update
      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .upsert(updateData, {
          onConflict: 'instance_name'
        });

      if (error) {
        console.error('❌ Erro ao atualizar status da instância:', error);
        // Não falhar por causa de erro de banco
        console.log('⚠️ Continuando sem atualizar banco devido ao erro');
      } else {
        console.log(`✅ Status da instância ${instanceName} atualizado para: ${status}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao atualizar status da instância:`, error);
      // Não falhar por causa de erro de banco
      console.log('⚠️ Continuando sem atualizar banco devido ao erro');
    }
  }

  // Enviar mensagem
  async sendMessage(instanceName, toNumber, message) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      // Formatar número para o formato do WhatsApp
      const formattedNumber = toNumber.includes('@') ? toNumber : `${toNumber}@s.whatsapp.net`;
      
      console.log(`📱 Enviando mensagem para ${formattedNumber}: ${message}`);
      
      // Enviar mensagem via WhatsApp Web
      const result = await this.instance.client.sendMessage(formattedNumber, message);
      
      console.log(`✅ Mensagem enviada com sucesso: ${result.key.id}`);
      
             // Salvar mensagem no banco
       const messageService = require('./messageService');
       await messageService.saveMessage({
         instanceName,
         messageId: result.key.id,
         fromNumber: `${this.instance.info.phone}@s.whatsapp.net`,
         toNumber: toNumber,
         messageType: 'text',
         messageContent: message,
         isFromMe: true,
         status: 'sent'
       });
      
      return {
        success: true,
        messageId: result.key.id,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar mensagem:`, error);
      throw error;
    }
  }

  // Responder diretamente a uma mensagem (usando reply())
  async replyToMessage(instanceName, messageId, replyText) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      console.log(`📱 Respondendo à mensagem ${messageId}: ${replyText}`);
      
      // Buscar a mensagem original pelo ID
      const chat = await this.instance.client.getChatById(messageId.split('_')[0]);
      if (!chat) {
        throw new Error('Chat não encontrado');
      }

      const messages = await chat.fetchMessages({ limit: 100 });
      const originalMessage = messages.find(msg => msg.id._serialized === messageId);
      
      if (!originalMessage) {
        throw new Error('Mensagem original não encontrada');
      }

      // Usar o método reply() para responder diretamente
      const result = await originalMessage.reply(replyText);
      
      console.log(`✅ Resposta enviada com sucesso: ${result.key.id}`);
      
      // Salvar mensagem no banco
      const messageService = require('./messageService');
      await messageService.saveMessage({
        instanceName,
        messageId: result.key.id,
        fromNumber: `${this.instance.info.phone}@s.whatsapp.net`,
        toNumber: originalMessage.from,
        messageType: 'text',
        messageContent: replyText,
        isFromMe: true,
        status: 'sent',
        replyTo: messageId
      });
      
      return {
        success: true,
        messageId: result.key.id,
        timestamp: new Date().toISOString(),
        replyTo: messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao responder mensagem:`, error);
      throw error;
    }
  }

  // Sincronizar conversas existentes
  async syncExistingConversations(instanceName, client) {
    try {
      console.log(`🔄 Sincronizando conversas existentes para ${instanceName}...`);
      
      // Obter chats existentes
      const chats = await client.getChats();
      console.log(`📱 Encontradas ${chats.length} conversas para sincronizar`);
      
      let syncedCount = 0;
      
      for (const chat of chats) {
        try {
          // Verificar se é um chat válido
          if (!chat.id || !chat.id._serialized) continue;
          
          const chatId = chat.id._serialized;
          const isGroup = chat.isGroup || false;
          const contactNumber = isGroup ? chatId : chatId.split('@')[0];
          
          // Gerar ID de conversa
          const conversationId = this.generateConversationId(contactNumber, contactNumber, instanceName);
          
          // Verificar se a conversa já existe
          const { data: existingConv, error: checkError } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`❌ Erro ao verificar conversa ${conversationId}:`, checkError);
            continue;
          }

          if (!existingConv) {
            // Criar nova conversa
            const { error: insertError } = await supabaseAdmin
              .from('conversations')
              .insert({
                id: conversationId,
                customer_id: null,
                lead_id: null,
                whatsapp_instance: instanceName,
                whatsapp_number: contactNumber,
                status: 'open',
                pipeline_status: 'lead-bruto',
                last_message_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error(`❌ Erro ao criar conversa ${conversationId}:`, insertError);
            } else {
              console.log(`✅ Conversa criada: ${conversationId}`);
              syncedCount++;
            }
          }
          
          // Sincronizar mensagens da conversa (limitado para performance)
          await this.syncChatMessages(instanceName, chat, 20);
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar chat ${chat.id?._serialized}:`, error);
        }
      }
      
      console.log(`✅ Sincronização concluída! ${syncedCount} conversas sincronizadas de ${chats.length}`);
      
    } catch (error) {
      console.error('❌ Erro na sincronização de conversas:', error);
    }
  }

  // Sincronizar mensagens de um chat específico
  async syncChatMessages(instanceName, chat, limit = 20) {
    try {
      const chatId = chat.id._serialized;
      console.log(`📨 Sincronizando ${limit} mensagens da conversa ${chatId}`);
      
      // Obter mensagens do chat
      const messages = await chat.fetchMessages({ limit });
      
      for (const message of messages) {
        try {
          // Verificar se a mensagem já existe
          const { data: existingMsg, error: checkError } = await supabaseAdmin
            .from('whatsapp_messages')
            .select('id')
            .eq('id', message.key.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`❌ Erro ao verificar mensagem ${message.key.id}:`, checkError);
            continue;
          }

          if (!existingMsg) {
            // Salvar mensagem no banco
            const messageService = require('./messageService');
            await messageService.saveReceivedMessage(instanceName, message);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao sincronizar mensagem ${message.key.id}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro ao sincronizar mensagens do chat ${chat.id?._serialized}:`, error);
    }
  }

  // Obter tipo da mensagem
  getMessageType(message) {
    if (message.type === 'chat' || message.type === 'conversation') {
      return 'text';
    } else if (message.type === 'image') {
      return 'image';
    } else if (message.type === 'audio') {
      return 'audio';
    } else if (message.type === 'video') {
      return 'video';
    } else if (message.type === 'document') {
      return 'document';
    } else if (message.type === 'sticker') {
      return 'sticker';
    }
    return 'unknown';
  }

  // Obter URL da mídia
  async getMediaUrl(message) {
    try {
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media && media.data) {
          return media.data; // Base64 da mídia
        }
        console.log('⚠️ Mídia baixada mas sem dados:', media);
        return null;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter mídia:', error);
      return null;
    }
  }

  // Obter tipo da mídia
  getMediaType(message) {
    if (message.hasMedia) {
      return message.type;
    }
    return null;
  }

  // Verificar se há instância ativa
  hasInstance() {
    return this.instance !== null;
  }

  // Obter todas as conversas (chats) ativas
  async getChats() {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      console.log('📱 Obtendo conversas ativas...');
      const chats = await this.instance.client.getChats();
      
      // Filtrar apenas conversas válidas e ordenar por última mensagem
      const validChats = chats
        .filter(chat => chat.id && chat.id._serialized)
        .sort((a, b) => {
          const aTime = a.lastMessage ? a.lastMessage.timestamp : 0;
          const bTime = b.lastMessage ? b.lastMessage.timestamp : 0;
          return bTime - aTime;
        });

      console.log(`✅ ${validChats.length} conversas obtidas`);
      return validChats;

    } catch (error) {
      console.error('❌ Erro ao obter conversas:', error);
      throw error;
    }
  }

  // Obter contatos de uma conversa
  async getChatContacts(chatId) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      const chat = await this.instance.client.getChatById(chatId);
      if (!chat) {
        throw new Error('Conversa não encontrada');
      }

      // Para conversas individuais, obter informações do contato
      if (chat.isGroup) {
        const participants = await chat.participants;
        return participants.map(participant => ({
          id: participant.id._serialized,
          name: participant.name || participant.id.user,
          phone: participant.id.user,
          isGroup: false,
          isAdmin: participant.isAdmin || false
        }));
      } else {
        // Conversa individual
        const contact = await this.instance.client.getContactById(chatId);
        return [{
          id: contact.id._serialized,
          name: contact.name || contact.pushname || contact.id.user,
          phone: contact.id.user,
          isGroup: false,
          isBusiness: contact.isBusiness || false,
          isVerified: contact.isVerified || false
        }];
      }

    } catch (error) {
      console.error('❌ Erro ao obter contatos da conversa:', error);
      throw error;
    }
  }

  // Obter mensagens de uma conversa com paginação
  async getChatMessages(chatId, limit = 50, beforeId = null) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      const chat = await this.instance.client.getChatById(chatId);
      if (!chat) {
        throw new Error('Conversa não encontrada');
      }

      const options = { limit };
      if (beforeId) {
        options.before = beforeId;
      }

      const messages = await chat.fetchMessages(options);
      
      // Converter mensagens para formato padronizado
      const formattedMessages = messages.map(message => ({
        id: message.id._serialized,
        from: message.from,
        to: message.to,
        body: message.body || '',
        timestamp: message.timestamp * 1000, // Converter para milissegundos
        type: this.getMessageType(message),
        isFromMe: message.fromMe,
        hasMedia: message.hasMedia,
        mediaType: message.hasMedia ? this.getMediaType(message) : null,
        status: message.ack || 0
      }));

      return formattedMessages;

    } catch (error) {
      console.error('❌ Erro ao obter mensagens da conversa:', error);
      throw error;
    }
  }

  // Marcar conversa como lida
  async markChatAsRead(chatId) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      const chat = await this.instance.client.getChatById(chatId);
      if (!chat) {
        throw new Error('Conversa não encontrada');
      }

      await chat.sendSeen();
      console.log(`✅ Conversa ${chatId} marcada como lida`);

      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao marcar conversa como lida:', error);
      throw error;
    }
  }

  // Obter informações detalhadas de um contato
  async getContactInfo(contactId) {
    try {
      if (!this.instance || this.instance.status !== 'connected') {
        throw new Error('Instância não está conectada');
      }

      const contact = await this.instance.client.getContactById(contactId);
      if (!contact) {
        throw new Error('Contato não encontrado');
      }

      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || contact.id.user,
        phone: contact.id.user,
        isGroup: contact.isGroup || false,
        isBusiness: contact.isBusiness || false,
        isVerified: contact.isVerified || false,
        pushname: contact.pushname,
        shortName: contact.shortName,
        profilePicUrl: contact.profilePicUrl,
        status: contact.status
      };

    } catch (error) {
      console.error('❌ Erro ao obter informações do contato:', error);
      throw error;
    }
  }

  // Sincronizar conversas de forma mais eficiente
  async syncConversationsIncremental(instanceName, client) {
    try {
      console.log(`🔄 Sincronização incremental de conversas para ${instanceName}...`);
      
      if (!client || !client.pupPage || client.pupPage.isClosed()) {
        console.log('⚠️ Cliente não está mais válido, pulando sincronização');
        return;
      }
      
      // Obter conversas com retry
      let chats = [];
      try {
        chats = await client.getChats();
        console.log(`📱 Encontradas ${chats.length} conversas para sincronizar`);
      } catch (chatsError) {
        console.error('❌ Erro ao obter chats:', chatsError);
        return;
      }

      const messageService = require('./messageService');
      let totalMessages = 0;
      let processedChats = 0;
      
      // Processar apenas as primeiras 10 conversas para evitar sobrecarga
      const chatsToProcess = chats.slice(0, 10);
      
      for (const chat of chatsToProcess) {
        try {
          // Verificar se o cliente ainda está válido
          if (!client || !client.pupPage || client.pupPage.isClosed()) {
            console.log('⚠️ Cliente fechado durante sincronização, parando...');
            break;
          }
          
          // Obter apenas as últimas 10 mensagens para cada conversa
          const messages = await chat.fetchMessages({ limit: 10 });
          console.log(`📨 Sincronizando ${messages.length} mensagens da conversa ${chat.id._serialized}`);
          
          for (const message of messages) {
            try {
              // Verificar se a mensagem já existe no banco
              const existingMessage = await messageService.getMessageById(message.id._serialized);
              if (existingMessage) {
                continue; // Pular se já existe
              }
              
              // Salvar mensagem no banco
              await messageService.saveMessage({
                instanceName,
                messageId: message.id._serialized,
                fromNumber: message.from,
                toNumber: message.to,
                messageType: this.getMessageType(message),
                messageContent: message.body || '',
                mediaUrl: message.hasMedia ? await this.getMediaUrl(message) : null,
                mediaType: message.hasMedia ? this.getMediaType(message) : null,
                isFromMe: message.fromMe,
                status: 'received'
              });
              
              totalMessages++;
            } catch (messageError) {
              console.error(`❌ Erro ao salvar mensagem ${message.id._serialized}:`, messageError);
            }
          }
          
          processedChats++;
          
          // Pausa menor para sincronização incremental
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (chatError) {
          console.error(`❌ Erro ao sincronizar conversa ${chat.id._serialized}:`, chatError);
          
          if (chatError.message.includes('Session closed') || chatError.message.includes('Protocol error')) {
            console.log('⚠️ Sessão fechada detectada, parando sincronização...');
            break;
          }
        }
      }
      
      console.log(`✅ Sincronização incremental concluída! ${totalMessages} mensagens sincronizadas de ${processedChats} conversas`);
      
    } catch (error) {
      console.error(`❌ Erro na sincronização incremental:`, error);
    }
  }

  // Salvar QR code no banco
  async saveQRCodeToDatabase(instanceName, qrCode) {
    try {
      console.log(`💾 Salvando QR code para instância: ${instanceName}`);
      
      // Tentar upsert (inserir ou atualizar) em vez de apenas update
      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .upsert({ 
          instance_name: instanceName,
          qr_code: qrCode,
          status: 'qr_ready',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'instance_name'
        });

      if (error) {
        console.error('❌ Erro ao salvar QR code no banco:', error);
        // Não falhar por causa de erro de banco, apenas logar
        console.log('⚠️ Continuando sem salvar no banco devido ao erro');
      } else {
        console.log('✅ QR code salvo no banco com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar QR code:', error);
      // Não falhar por causa de erro de banco
      console.log('⚠️ Continuando sem salvar no banco devido ao erro');
    }
  }

  // Salvar número do telefone no banco
  async savePhoneNumberToDatabase(instanceName, phoneNumber) {
    try {
      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (error) {
        console.error('❌ Erro ao salvar número no banco:', error);
      } else {
        console.log('✅ Número salvo no banco');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar número:', error);
    }
  }

  // Salvar erro no banco
  async saveErrorToDatabase(instanceName, error) {
    try {
      const { error: dbError } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          last_error: error.message,
          error_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (dbError) {
        console.error('❌ Erro ao salvar erro no banco:', dbError);
      } else {
        console.log('✅ Erro salvo no banco');
      }
    } catch (dbError) {
      console.error('❌ Erro ao salvar erro:', dbError);
    }
  }

  // Criar ou atualizar conversa automaticamente
  async createOrUpdateConversation(instanceName, message) {
    try {
      const conversationId = this.generateConversationId(message.from, message.to || message.from, instanceName);
      
      // Verificar se a conversa já existe
      const { data: existingConv, error: checkError } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar conversa:', checkError);
        return;
      }

      if (!existingConv) {
        // Criar nova conversa
        const { error: insertError } = await supabaseAdmin
          .from('conversations')
          .insert({
            id: conversationId,
            customer_id: null,
            lead_id: null,
            whatsapp_instance: instanceName,
            whatsapp_number: message.from.split('@')[0],
            status: 'open',
            pipeline_status: 'lead-bruto',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Erro ao criar conversa:', insertError);
        } else {
          console.log(`✅ Nova conversa criada: ${conversationId}`);
        }
      } else {
        // Atualizar última mensagem
        const { error: updateError } = await supabaseAdmin
          .from('conversations')
          .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        if (updateError) {
          console.error('❌ Erro ao atualizar conversa:', updateError);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar/atualizar conversa:', error);
    }
  }

  // Gerar ID de conversa
  generateConversationId(fromNumber, toNumber, instanceName) {
    const sortedNumbers = [fromNumber, toNumber].sort();
    return `${instanceName}_${sortedNumbers[0]}_${sortedNumbers[1]}`;
  }

  // Iniciar sincronização automática
  startAutoSync(instanceName, client) {
    if (this.autoSyncIntervals && this.autoSyncIntervals[instanceName]) {
      clearInterval(this.autoSyncIntervals[instanceName]);
    }

    if (!this.autoSyncIntervals) {
      this.autoSyncIntervals = {};
    }

    // Sincronizar a cada 5 minutos
    this.autoSyncIntervals[instanceName] = setInterval(async () => {
      try {
        if (client && client.pupPage && !client.pupPage.isClosed()) {
          console.log(`🔄 Sincronização automática para ${instanceName}...`);
          await this.syncExistingConversations(instanceName, client);
        }
      } catch (error) {
        console.error(`❌ Erro na sincronização automática de ${instanceName}:`, error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    console.log(`✅ Sincronização automática iniciada para ${instanceName}`);
  }

  // Parar sincronização automática
  stopAutoSync(instanceName) {
    if (this.autoSyncIntervals && this.autoSyncIntervals[instanceName]) {
      clearInterval(this.autoSyncIntervals[instanceName]);
      delete this.autoSyncIntervals[instanceName];
      console.log(`🛑 Sincronização automática parada para ${instanceName}`);
    }
  }

  // Método auxiliar para processar QR code
  async processQRCode(instanceName, qr) {
    try {
      console.log(`🔄 Processando QR code para instância: ${instanceName}`);
      
      // Verificar se a instância ainda existe
      if (!this.instance || this.instance.instanceName !== instanceName) {
        console.log('⚠️ Instância não encontrada durante processamento do QR code');
        return;
      }
      
      // Atualizar status da instância
      this.instance.status = 'qr_ready';
      this.instance.qrCode = qr;
      
      console.log(`✅ Status da instância atualizado para: ${this.instance.status}`);
      
      // Salvar QR code no banco (não falhar se der erro)
      try {
        await this.saveQRCodeToDatabase(instanceName, qr);
      } catch (dbError) {
        console.error('❌ Erro ao salvar QR code no banco:', dbError);
        // Continuar mesmo com erro de banco
      }
      
      // Notificar clientes WebSocket
      if (global.io) {
        global.io.to(instanceName).emit('qr_code_ready', {
          instanceName,
          qrCode: qr,
          timestamp: new Date().toISOString()
        });
        console.log('📡 WebSocket: QR code notificado para clientes');
      }
      
      console.log(`✅ QR code processado com sucesso para ${instanceName}`);
      
    } catch (error) {
      console.error('❌ Erro ao processar QR code:', error);
    }
  }

  // Recuperar instâncias existentes de usuários
  async recoverUserInstances(userId) {
    try {
      console.log(`🔄 Tentando recuperar instâncias do usuário: ${userId}`);
      
      // Buscar instâncias do usuário no banco
      const { data: instances, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'connected');
      
      if (error) {
        console.error('❌ Erro ao buscar instâncias do usuário:', error);
        return { success: false, error: error.message };
      }
      
      if (!instances || instances.length === 0) {
        console.log('ℹ️ Nenhuma instância ativa encontrada para o usuário');
        return { success: true, instances: [] };
      }
      
      console.log(`📱 Encontradas ${instances.length} instâncias para recuperar`);
      
      const recoveredInstances = [];
      
      for (const instance of instances) {
        try {
          console.log(`🔄 Tentando reconectar instância: ${instance.instance_name}`);
          
          // Tentar reconectar usando LocalAuth
          const result = await this._reconnectInstance(instance.instance_name, userId);
          
          if (result.success) {
            recoveredInstances.push({
              instanceName: instance.instance_name,
              status: 'connected',
              phone: instance.phone
            });
            console.log(`✅ Instância ${instance.instance_name} reconectada com sucesso`);
          } else {
            console.log(`⚠️ Falha ao reconectar instância ${instance.instance_name}: ${result.message}`);
          }
          
        } catch (reconnectError) {
          console.error(`❌ Erro ao reconectar instância ${instance.instance_name}:`, reconnectError);
        }
      }
      
      return {
        success: true,
        instances: recoveredInstances,
        total: instances.length,
        recovered: recoveredInstances.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao recuperar instâncias do usuário:', error);
      return { success: false, error: error.message };
    }
  }

  // Método interno para reconectar instância existente
  async _reconnectInstance(instanceName, userId) {
    try {
      // Verificar se já existe uma instância ativa
      if (this.instance && this.instance.instanceName === instanceName) {
        console.log(`ℹ️ Instância ${instanceName} já está ativa`);
        return { success: true, message: 'Instância já está ativa' };
      }
      
      // Criar diretório de autenticação específico para o usuário
      const userAuthPath = path.join(this.authPath, `user_${userId}`, instanceName);
      
      if (!fs.existsSync(userAuthPath)) {
        console.log(`⚠️ Diretório de autenticação não encontrado: ${userAuthPath}`);
        return { success: false, message: 'Diretório de autenticação não encontrado' };
      }
      
      // Configurar cliente WhatsApp Web com LocalAuth existente
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `${userId}_${instanceName}`,
          dataPath: userAuthPath
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
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off',
            '--max_old_space_size=4096',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-component-extensions-with-background-pages',
            '--disable-background-networking',
            '--disable-sync-preferences',
            '--disable-background-media-suspend',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-features=AudioServiceOutOfProcess',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-client-side-phishing-detection',
            '--disable-threaded-animation',
            '--disable-threaded-scrolling',
            '--disable-in-process-stack-traces',
            '--disable-histogram-customizer',
            '--disable-gl-extensions',
            '--disable-composited-antialiasing',
            '--disable-canvas-aa',
            '--disable-3d-apis',
            '--disable-accelerated-layers',
            '--disable-accelerated-plugins',
            '--disable-accelerated-video',
            '--disable-accelerated-video-decode',
            '--disable-gpu-sandbox',
            '--disable-software-rasterizer',
            '--single-process',
            '--no-zygote'
          ],
          timeout: 60000,
          protocolTimeout: 60000,
          browserWSEndpoint: null,
          ignoreDefaultArgs: ['--disable-extensions'],
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false
        },
        webVersion: '2.2402.5',
        webVersionCache: {
          type: 'local'
        }
      });
      
      // Configurar eventos
      this.setupEvents(client, instanceName);
      
      // Salvar instância em memória
      this.instance = {
        client,
        instanceName,
        userId,
        status: 'connecting',
        phone: null,
        qrCode: null,
        createdAt: new Date(),
        isAuthenticated: false,
        authPath: userAuthPath
      };
      
      // Inicializar cliente
      await client.initialize();
      
      // Aguardar estabilização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Atualizar status no banco
      await this.updateInstanceStatus(instanceName, 'connected');
      
      return { success: true, message: 'Instância reconectada com sucesso' };
      
    } catch (error) {
      console.error(`❌ Erro ao reconectar instância ${instanceName}:`, error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new WhatsAppWebService();

