const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

class EvolutionApiService {
  constructor() {
    this.instances = new Map();
    this.qrCodes = new Map();
    this.contactsCache = new Map(); // Cache para contatos
    this.cacheExpiry = new Map(); // Expiração do cache (5 minutos)
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos
    this.logs = new Map();
    this.authPath = path.join(__dirname, '../../.wwebjs_auth');
  }

  // Limpar sessões antigas ou corrompidas
  async cleanupSessions() {
    try {
      if (fs.existsSync(this.authPath)) {
        const sessions = fs.readdirSync(this.authPath);
        for (const session of sessions) {
          const sessionPath = path.join(this.authPath, session);
          
          // Verificar se a sessão está sendo usada por uma instância ativa
          const isActive = Array.from(this.instances.keys()).some(instanceName => 
            instanceName === session
          );
          
          if (isActive) {
            console.log(`📱 Sessão ${session} está ativa, pulando...`);
            continue;
          }
          
          // Verificar arquivos de debug
          const debugLogPath = path.join(sessionPath, 'Default', 'chrome_debug.log');
          
          if (fs.existsSync(debugLogPath)) {
            try {
              // Tentar renomear o arquivo para verificar se está bloqueado
              const tempPath = debugLogPath + '.tmp';
              fs.renameSync(debugLogPath, tempPath);
              fs.renameSync(tempPath, debugLogPath);
            } catch (error) {
              if (error.code === 'EBUSY' || error.code === 'EACCES') {
                console.log(`⚠️ Arquivo ${debugLogPath} está bloqueado, removendo sessão ${session}`);
                try {
                  // Tentar remover arquivo por arquivo
                  const removeFile = (filePath) => {
                    try {
                      if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                      }
                    } catch (e) {
                      // Ignorar erros de arquivo individual
                    }
                  };
                  
                  // Remover arquivos específicos primeiro
                  removeFile(debugLogPath);
                  
                  // Tentar remover diretório
                  try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log(`✅ Sessão ${session} removida com sucesso`);
                  } catch (removeError) {
                    console.error(`❌ Erro ao remover sessão ${session}:`, removeError.message);
                  }
                } catch (removeError) {
                  console.error(`❌ Erro ao remover sessão ${session}:`, removeError.message);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar sessões:', error.message);
    }
  }

  // Limpeza completa do ambiente
  async fullCleanup() {
    try {
      console.log('🧹 Iniciando limpeza completa do ambiente...');
      
      // Limpar todas as instâncias ativas
      for (const [instanceName, client] of this.instances) {
        try {
          console.log(`🛑 Finalizando instância ${instanceName}...`);
          await client.destroy();
        } catch (error) {
          console.error(`Erro ao finalizar instância ${instanceName}:`, error.message);
        }
      }
      
      // Limpar mapas
      this.instances.clear();
      this.qrCodes.clear();
      this.logs.clear();
      
      // Limpar diretórios
      const cachePath = path.join(__dirname, '../../.wwebjs_cache');
      
      if (fs.existsSync(this.authPath)) {
        try {
          fs.rmSync(this.authPath, { recursive: true, force: true });
          console.log('✅ Diretório de autenticação removido');
        } catch (error) {
          console.error('Erro ao remover diretório de autenticação:', error.message);
        }
      }
      
      if (fs.existsSync(cachePath)) {
        try {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log('✅ Cache removido');
        } catch (error) {
          console.error('Erro ao remover cache:', error.message);
        }
      }
      
      console.log('✅ Limpeza completa finalizada');
      
    } catch (error) {
      console.error('Erro durante limpeza completa:', error.message);
    }
  }

  // Adicionar log
  addLog(instanceName, message, type = 'info') {
    if (!this.logs.has(instanceName)) {
      this.logs.set(instanceName, []);
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      type
    };
    
    this.logs.get(instanceName).push(logEntry);
    
    // Manter apenas os últimos 50 logs
    if (this.logs.get(instanceName).length > 50) {
      this.logs.get(instanceName).shift();
    }
  }

  // Listar instâncias
  getInstances() {
    // Verificar e corrigir status antes de listar
    this.checkAndFixInstanceStatus();
    
    return Array.from(this.instances.keys()).map(name => {
      const client = this.instances.get(name);
      const instanceLogs = this.logs.get(name) || [];
      
      // Determinar status baseado em logs e estado do cliente
      let status = 'connecting';
      if (client.isReady) {
        status = 'connected';
      } else {
        // Verificar se há logs de sucesso recentes
        const recentLogs = instanceLogs.slice(-3);
        const hasReadyLog = recentLogs.some(log => 
          log.message.includes('WhatsApp client is ready!') || 
          log.message.includes('authenticated successfully')
        );
        if (hasReadyLog) {
          status = 'connected';
        }
      }
      
      return {
        instance: {
          instanceName: name,
          status: status,
          qrcode: this.qrCodes.get(name) || null,
          phone_number: client.info?.wid?.user || null,
          logs: instanceLogs.slice(-10), // Últimos 10 logs
          lastActivity: instanceLogs.length > 0 ? instanceLogs[instanceLogs.length - 1].timestamp : null
        }
      };
    });
  }

  // Criar instância
  async createInstance(instanceName, webhookUrl = null) {
    if (!instanceName) {
      throw new Error('instanceName is required');
    }
    
    if (this.instances.has(instanceName)) {
      throw new Error('Instance already exists');
    }
    
    try {
      // Limpar sessões antes de criar nova instância
      await this.cleanupSessions();
      
      // Se houver muitas instâncias ativas, fazer limpeza completa
      if (this.instances.size > 5) {
        console.log('⚠️ Muitas instâncias ativas, fazendo limpeza completa...');
        await this.fullCleanup();
      }
      
      this.addLog(instanceName, 'Creating instance...', 'info');
      
      const client = new Client({
        authStrategy: new LocalAuth({ 
          clientId: instanceName,
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
             '--single-process',
             '--disable-gpu',
             '--disable-background-timer-throttling',
             '--disable-backgrounding-occluded-windows',
             '--disable-renderer-backgrounding',
             '--disable-features=TranslateUI',
             '--disable-ipc-flooding-protection',
             '--disable-web-security',
             '--disable-features=VizDisplayCompositor',
             '--disable-extensions',
             '--disable-plugins',
             '--disable-images',
             '--disable-javascript',
             '--disable-default-apps',
             '--disable-sync',
             '--disable-translate',
             '--hide-scrollbars',
             '--mute-audio',
             '--no-default-browser-check',
             '--disable-background-networking',
             '--disable-component-extensions-with-background-pages',
             '--disable-backgrounding-occluded-windows',
             '--disable-client-side-phishing-detection',
             '--disable-domain-reliability',
             '--disable-features=AudioServiceOutOfProcess',
             '--disable-hang-monitor',
             '--disable-ipc-flooding-protection',
             '--disable-prompt-on-repost',
             '--disable-renderer-backgrounding',
             '--disable-sync-preferences',
             '--force-color-profile=srgb',
             '--metrics-recording-only',
             '--no-first-run',
             '--password-store=basic',
             '--use-mock-keychain',
             '--disable-blink-features=AutomationControlled',
             '--disable-web-security',
             '--disable-features=VizDisplayCompositor',
             '--single-process',
             '--no-zygote',
             '--disable-accelerated-2d-canvas',
             '--disable-background-timer-throttling',
             '--disable-renderer-backgrounding',
             '--disable-features=TranslateUI',
             '--disable-ipc-flooding-protection'
           ],
           timeout: 180000,
           protocolTimeout: 180000,
           defaultViewport: null,
           ignoreHTTPSErrors: true,
           ignoreDefaultArgs: ['--enable-automation'],
           executablePath: process.platform === 'win32' ? undefined : undefined
         }
      });
      
      // REMOVER TODOS OS EVENTOS AUTOMÁTICOS DE MENSAGEM
      // Apenas eventos essenciais para status da conexão
      
      client.on('qr', async (qr) => {
        this.addLog(instanceName, 'QR Code received', 'info');
        console.log(`QR Code received for ${instanceName}`);
        
        try {
          const qrCodeDataUrl = `data:image/png;base64,${qr}`;
          await this.saveQRCode(instanceName, qrCodeDataUrl);
        } catch (error) {
          console.error('Error saving QR code:', error);
        }
      });
      
      client.on('ready', async () => {
        this.addLog(instanceName, 'WhatsApp client is ready!', 'success');
        this.qrCodes.delete(instanceName);
        console.log(`Client ${instanceName} is ready!`);
        
        // Atualizar status no banco de dados
        try {
          const { supabaseAdmin } = require('./supabase');
          const phoneNumber = client.info?.wid?.user || null;
          
          console.log(`📱 Atualizando instância ${instanceName} no banco:`, {
            status: 'connected',
            phone_number: phoneNumber
          });
          
          const { error: dbError } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: 'connected',
              phone_number: phoneNumber,
              updated_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);

          if (dbError) {
            console.error('❌ Erro ao atualizar status no banco:', dbError);
          } else {
            console.log(`✅ Status atualizado no banco para ${instanceName}: connected (${phoneNumber})`);
          }
        } catch (dbError) {
          console.error('❌ Erro ao atualizar status no banco:', dbError);
        }
      });
      
      client.on('authenticated', async () => {
        this.addLog(instanceName, 'WhatsApp authenticated successfully', 'success');
        
        // Atualizar status para 'connecting' quando autenticado
        try {
          const { supabaseAdmin } = require('./supabase');
          const { error: dbError } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: 'connecting',
              updated_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);

          if (!dbError) {
            console.log(`✅ Status atualizado para ${instanceName}: connecting (authenticated)`);
          }
        } catch (dbError) {
          console.error('❌ Erro ao atualizar status após autenticação:', dbError);
        }
      });
      
      client.on('auth_failure', async (msg) => {
        this.addLog(instanceName, `Authentication failed: ${msg}`, 'error');
        
        // Atualizar status para 'disconnected' quando falha na autenticação
        try {
          const { supabaseAdmin } = require('./supabase');
          const { error: dbError } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);

          if (!dbError) {
            console.log(`✅ Status atualizado para ${instanceName}: disconnected (auth failure)`);
          }
        } catch (dbError) {
          console.error('❌ Erro ao atualizar status após falha de autenticação:', dbError);
        }
      });
      
      client.on('disconnected', async (reason) => {
        this.addLog(instanceName, `Disconnected: ${reason}`, 'warning');
        
        // Remover da memória primeiro
        this.instances.delete(instanceName);
        this.qrCodes.delete(instanceName);
        
        // Atualizar status no banco de dados
        try {
          const { supabaseAdmin } = require('./supabase');
          
          console.log(`📱 Atualizando instância ${instanceName} no banco: disconnected`);
          
          const { error: dbError } = await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('instance_name', instanceName);

          if (dbError) {
            console.error('❌ Erro ao atualizar status no banco:', dbError);
          } else {
            console.log(`✅ Status atualizado no banco para ${instanceName}: disconnected`);
          }
        } catch (dbError) {
          console.error('❌ Erro ao atualizar status no banco:', dbError);
        }
      });
      
      // Adicionar tratamento de erro para inicialização
      client.on('error', (error) => {
        this.addLog(instanceName, `Client error: ${error.message}`, 'error');
        console.error(`Client error for ${instanceName}:`, error);
      });
      
      // Adicionar timeout para inicialização
      const initPromise = client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout')), 120000);
      });
      
      await Promise.race([initPromise, timeoutPromise]);
      this.instances.set(instanceName, client);
      
      // Salvar instância no banco de dados (usar upsert para evitar duplicação)
      try {
        const { supabaseAdmin } = require('./supabase');
        const { error: dbError } = await supabaseAdmin
          .from('whatsapp_instances')
          .upsert({
            instance_name: instanceName,
            status: 'connecting',
            webhook_url: webhookUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'instance_name',
            ignoreDuplicates: false
          });

        if (dbError) {
          console.error('❌ Erro ao salvar instância no banco:', dbError);
        } else {
          console.log(`✅ Instância ${instanceName} salva/atualizada no banco de dados`);
        }
      } catch (dbError) {
        console.error('❌ Erro ao salvar instância no banco:', dbError);
      }
      
      return { 
        instance: { 
          instanceName,
          status: 'connecting'
        }
      };
      
    } catch (error) {
      this.addLog(instanceName, `Error creating instance: ${error.message}`, 'error');
      console.error('Error creating instance:', error);
      
      // Se o erro for relacionado a arquivos bloqueados, tentar limpar e recriar
      if (error.message.includes('EBUSY') || error.message.includes('resource busy')) {
        this.addLog(instanceName, 'Attempting to cleanup blocked files...', 'warning');
        try {
          await this.cleanupSessions();
          // Tentar novamente após limpeza
          return await this.createInstance(instanceName);
        } catch (retryError) {
          this.addLog(instanceName, `Retry failed: ${retryError.message}`, 'error');
          throw retryError;
        }
      }
      
      // Se o erro for de protocolo, tentar com configurações diferentes
      if (error.message.includes('Protocol error') || error.message.includes('Execution context was destroyed')) {
        this.addLog(instanceName, 'Protocol error detected, trying alternative configuration...', 'warning');
        try {
          return await this.createInstanceWithAlternativeConfig(instanceName);
        } catch (retryError) {
          this.addLog(instanceName, `Alternative config failed: ${retryError.message}`, 'error');
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  // Método alternativo para criar instância com configuração diferente
  async createInstanceWithAlternativeConfig(instanceName) {
    this.addLog(instanceName, 'Creating instance with alternative configuration...', 'info');
    
    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: instanceName,
        dataPath: this.authPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--disable-background-networking',
          '--disable-component-extensions-with-background-pages',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-domain-reliability',
          '--disable-features=AudioServiceOutOfProcess',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync-preferences',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--no-first-run',
          '--password-store=basic',
          '--use-mock-keychain',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--single-process',
          '--no-zygote',
          '--disable-accelerated-2d-canvas',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 180000,
        protocolTimeout: 180000,
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: ['--enable-automation']
      }
    });
    
    // Configurar eventos
    client.on('qr', async (qr) => {
      try {
        const qrCodeDataUrl = await qrcode.toDataURL(qr);
        this.qrCodes.set(instanceName, qrCodeDataUrl);
        this.addLog(instanceName, 'QR Code generated (alternative config) - scan with WhatsApp', 'success');
        console.log(`QR Code generated for ${instanceName} (alternative config)`);
      } catch (error) {
        this.addLog(instanceName, `Error generating QR code: ${error.message}`, 'error');
        console.error('Error generating QR code:', error);
      }
    });
    
    client.on('ready', () => {
      this.addLog(instanceName, 'WhatsApp client is ready! (alternative config)', 'success');
      this.qrCodes.delete(instanceName);
      console.log(`Client ${instanceName} is ready! (alternative config)`);
    });
    
    client.on('authenticated', () => {
      this.addLog(instanceName, 'WhatsApp authenticated successfully (alternative config)', 'success');
    });
    
    client.on('auth_failure', (msg) => {
      this.addLog(instanceName, `Authentication failed: ${msg}`, 'error');
    });
    
    client.on('disconnected', (reason) => {
      this.addLog(instanceName, `Disconnected: ${reason}`, 'warning');
      this.instances.delete(instanceName);
      this.qrCodes.delete(instanceName);
    });
    
    client.on('error', (error) => {
      this.addLog(instanceName, `Client error: ${error.message}`, 'error');
      console.error(`Client error for ${instanceName}:`, error);
    });
    
    await client.initialize();
    this.instances.set(instanceName, client);
    
    return { 
      instance: { 
        instanceName,
        status: 'connecting'
      }
    };
  }

  // Conectar instância (gerar QR code)
  async getQRCode(instanceName) {
    if (!this.instances.has(instanceName)) {
      throw new Error('Instance not found');
    }
    
    const client = this.instances.get(instanceName);
    const instanceLogs = this.logs.get(instanceName) || [];
    
    // Verificar se o cliente está pronto ou se há logs de sucesso recentes
    const isClientReady = client.isReady || instanceLogs.slice(-3).some(log => 
      log.message.includes('WhatsApp client is ready!') || 
      log.message.includes('authenticated successfully')
    );
    
    if (isClientReady) {
      return { 
        message: 'Client is already connected',
        status: 'open'
      };
    }
    
    // Primeiro, tentar buscar da memória
    const qrCode = this.qrCodes.get(instanceName);
    if (qrCode) {
      return { 
        qrcode: qrCode,
        status: 'connecting'
      };
    }
    
    // Se não estiver na memória, buscar do banco de dados
    try {
      const dbData = await this.getQRCodeFromDatabase(instanceName);
      if (dbData && dbData.qr_code && dbData.status === 'connecting') {
        // Restaurar na memória
        this.qrCodes.set(instanceName, dbData.qr_code);
        return { 
          qrcode: dbData.qr_code,
          status: 'connecting'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao buscar QR code do banco:', error);
    }
    
    throw new Error('QR code not available');
  }

  // Conectar instância (criar se não existir)
  async connectInstance(instanceName) {
    try {
      // Verificar se a instância já existe
      if (this.instances.has(instanceName)) {
        const client = this.instances.get(instanceName);
        
        // Se já está conectado, retornar status
        if (client.isReady) {
          this.addLog(instanceName, 'Instance already connected', 'success');
          return {
            instance: {
              instanceName,
              status: 'connected',
              phone_number: client.info?.wid?.user || null
            }
          };
        }
        
        // Se existe mas não está pronto, verificar QR code
        const qrCode = this.qrCodes.get(instanceName);
        if (qrCode) {
          this.addLog(instanceName, 'Instance exists, QR code available for scanning', 'info');
          return {
            instance: {
              instanceName,
              status: 'connecting',
              qrcode: qrCode
            }
          };
        }
        
        // Se existe mas não tem QR code, pode estar em processo de inicialização
        this.addLog(instanceName, 'Instance exists but not ready, waiting for initialization', 'info');
        return {
          instance: {
            instanceName,
            status: 'connecting'
          }
        };
      }
      
      // Se não existe, criar nova instância
      this.addLog(instanceName, 'Instance not found, creating new instance', 'info');
      return await this.createInstance(instanceName);
      
    } catch (error) {
      this.addLog(instanceName, `Error connecting instance: ${error.message}`, 'error');
      console.error('Error connecting instance:', error);
      throw error;
    }
  }

  // Obter QR code de uma instância
  async getQRCode(instanceName) {
    try {
      // Verificar se a instância existe
      if (!this.instances.has(instanceName)) {
        throw new Error('Instance not found');
      }
      
      const client = this.instances.get(instanceName);
      const qrCode = this.qrCodes.get(instanceName);
      
      // Se já está conectado
      if (client.isReady) {
        return {
          success: true,
          message: 'Client is already connected',
          status: 'connected',
          phone_number: client.info?.wid?.user || null
        };
      }
      
      // Se tem QR code disponível
      if (qrCode) {
        return {
          success: true,
          qrcode: qrCode,
          status: 'connecting',
          message: 'QR code available for scanning'
        };
      }
      
      // Se não tem QR code, pode estar em processo de inicialização
      return {
        success: true,
        status: 'connecting',
        message: 'Waiting for QR code generation'
      };
      
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }

  // Enviar mensagem
  async sendMessage(instanceName, number, text) {
    if (!this.instances.has(instanceName)) {
      throw new Error('Instance not found');
    }
    
    if (!number || !text) {
      throw new Error('number and text are required');
    }
    
    const client = this.instances.get(instanceName);
    
    if (!client.isReady) {
      throw new Error('Client is not ready');
    }
    
    try {
      // Limpar e validar o número de telefone
      let cleanNumber = number.toString().trim();
      
      // Remover caracteres especiais e espaços
      cleanNumber = cleanNumber.replace(/[^\d]/g, '');
      
      // Validar se o número tem pelo menos 10 dígitos
      if (cleanNumber.length < 10) {
        throw new Error(`Invalid phone number: ${number}. Must have at least 10 digits.`);
      }
      
      // Adicionar código do país se não estiver presente (assumindo Brasil +55)
      if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
        cleanNumber = '55' + cleanNumber;
      }
      
      // Formatar para o formato do WhatsApp
      const chatId = `${cleanNumber}@c.us`;
      
      console.log(`📤 Enviando mensagem para ${chatId} via ${instanceName}...`);
      console.log(`📝 Texto: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
      
      const message = await client.sendMessage(chatId, text);
      
      this.addLog(instanceName, `Message sent to ${chatId}: ${text.substring(0, 30)}...`, 'success');
      
      return {
        message: 'Message sent successfully',
        messageId: message.id._serialized,
        timestamp: new Date().toISOString(),
        chatId: chatId,
        originalNumber: number,
        cleanNumber: cleanNumber
      };
      
    } catch (error) {
      this.addLog(instanceName, `Error sending message: ${error.message}`, 'error');
      console.error('❌ Error sending message:', error);
      
      // Tratamento específico de erros
      if (error.message.includes('Evaluation failed')) {
        throw new Error(`Failed to send message: Invalid phone number format or WhatsApp connection issue. Original error: ${error.message}`);
      }
      
      if (error.message.includes('not found')) {
        throw new Error(`Contact not found: ${number}. Make sure the number is correct and the contact exists in WhatsApp.`);
      }
      
      if (error.message.includes('not ready')) {
        throw new Error(`WhatsApp client is not ready. Please wait for the connection to be established.`);
      }
      
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // Deletar instância
  async deleteInstance(instanceName) {
    if (!this.instances.has(instanceName)) {
      throw new Error('Instance not found');
    }
    
    try {
      const client = this.instances.get(instanceName);
      await client.destroy();
      this.instances.delete(instanceName);
      this.qrCodes.delete(instanceName);
      this.logs.delete(instanceName);
      
      return { 
        message: 'Instance deleted successfully' 
      };
      
    } catch (error) {
      console.error('Error deleting instance:', error);
      throw error;
    }
  }

  // Verificar e corrigir status das instâncias
  checkAndFixInstanceStatus() {
    this.instances.forEach((client, instanceName) => {
      const instanceLogs = this.logs.get(instanceName) || [];
      const recentLogs = instanceLogs.slice(-3);
      
      // Se há logs de sucesso mas o cliente não está marcado como pronto
      const hasReadyLog = recentLogs.some(log => 
        log.message.includes('WhatsApp client is ready!') || 
        log.message.includes('authenticated successfully')
      );
      
      if (hasReadyLog && !client.isReady) {
        // Forçar o status como pronto
        client.isReady = true;
        this.addLog(instanceName, 'Status corrigido: Cliente marcado como conectado', 'info');
      }
    });
  }

  // Health check
  getHealth() {
    // Verificar e corrigir status antes do health check
    this.checkAndFixInstanceStatus();
    
    return {
      status: 'OK',
      message: 'Evolution API Service is running',
      timestamp: new Date().toISOString(),
      instances: this.instances.size,
      version: '1.0.0'
    };
  }

  // Obter contatos de uma instância
  async getContacts(instanceName) {
    if (!this.instances.has(instanceName)) {
      throw new Error('Instance not found');
    }

    const client = this.instances.get(instanceName);
    
    // Verificar se o cliente está pronto com mais detalhes
    if (!client.isReady) {
      console.log(`⚠️ Cliente ${instanceName} não está pronto. Status: ${client.state}`);
      
      // Tentar retornar dados do cache mesmo que o cliente não esteja pronto
      const cachedContacts = this.contactsCache.get(instanceName);
      if (cachedContacts) {
        console.log(`✅ Retornando contatos do cache (cliente não pronto) para ${instanceName}`);
        return cachedContacts;
      }
      
      throw new Error(`Client is not ready. Current state: ${client.state}`);
    }

    try {
      console.log(`📱 Obtendo contatos da instância ${instanceName}...`);
      
      // Verificar cache
      const cachedContacts = this.contactsCache.get(instanceName);
      const cachedTimestamp = this.cacheExpiry.get(instanceName);

      if (cachedContacts && cachedTimestamp && Date.now() - cachedTimestamp < this.CACHE_DURATION) {
        console.log(`✅ Retornando contatos do cache para ${instanceName}`);
        return cachedContacts;
      }

      // Obter contatos do WhatsApp
      const contacts = await client.getContacts();
      
      // Filtrar e formatar contatos
      const formattedContacts = contacts
        .filter(contact => !contact.isMe && contact.id.user) // Excluir o próprio usuário e contatos sem número
        .map(contact => ({
          id: contact.id._serialized,
          name: contact.pushname || contact.name || contact.id.user,
          phone: contact.id.user,
          isGroup: contact.isGroup,
          isWAContact: contact.isWAContact,
          profilePicUrl: contact.profilePicUrl,
          status: contact.status,
          lastSeen: contact.lastSeen
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log(`✅ ${formattedContacts.length} contatos obtidos para ${instanceName}`);
      
      // Salvar no cache
      this.contactsCache.set(instanceName, formattedContacts);
      this.cacheExpiry.set(instanceName, Date.now());

      return formattedContacts;
      
    } catch (error) {
      console.error(`❌ Erro ao obter contatos de ${instanceName}:`, error);
      throw error;
    }
  }

  // Obter mensagens de uma instância
  async getMessages(instanceName, limit = 50) {
    if (!this.instances.has(instanceName)) {
      throw new Error('Instance not found');
    }

    const client = this.instances.get(instanceName);
    
    if (!client.isReady) {
      throw new Error('Client is not ready');
    }

    try {
      console.log(`💬 Obtendo mensagens da instância ${instanceName}...`);
      
      // Obter chats (conversas)
      const chats = await client.getChats();
      
      const allMessages = [];
      
      // Para cada chat, obter as últimas mensagens
      for (const chat of chats.slice(0, 10)) { // Limitar a 10 chats para performance
        try {
          const messages = await chat.fetchMessages({ limit: Math.ceil(limit / 10) });
          
          const formattedMessages = messages.map(msg => {
            // Corrigir timestamp: verificar se está em segundos ou milissegundos
            let correctTimestamp = msg.timestamp;
            
            // Se o timestamp for menor que 1 bilhão, está em segundos (Unix timestamp)
            // Se for maior, já está em milissegundos
            if (msg.timestamp < 1000000000000) {
              correctTimestamp = msg.timestamp * 1000;
            }
            
            // Identificar conversa correta
            const conversationId = msg.fromMe ? msg.to : msg.from;
            
            // Extrair número limpo para contatos
            const getCleanPhone = (phone) => {
              if (!phone) return null;
              if (phone.includes('@c.us')) {
                return phone.replace('@c.us', '');
              }
              return phone;
            };
            
            return {
              id: msg.id._serialized,
              from: msg.from,
              to: msg.to,
              body: msg.body,
              type: msg.type,
              timestamp: correctTimestamp, // Timestamp corrigido
              isFromMe: msg.fromMe,
              chatId: chat.id._serialized,
              chatName: chat.name || chat.id.user,
              isGroup: chat.isGroup,
              conversationId: conversationId, // ID da conversa para agrupamento
              cleanFrom: getCleanPhone(msg.from),
              cleanTo: getCleanPhone(msg.to)
            };
          });
          
          allMessages.push(...formattedMessages);
        } catch (chatError) {
          console.error(`⚠️ Erro ao obter mensagens do chat ${chat.id._serialized}:`, chatError);
        }
      }
      
      // Ordenar por timestamp (mais recentes primeiro) e limitar
      const sortedMessages = allMessages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      console.log(`✅ ${sortedMessages.length} mensagens obtidas para ${instanceName}`);
      return sortedMessages;
      
    } catch (error) {
      console.error(`❌ Erro ao obter mensagens de ${instanceName}:`, error);
      throw error;
    }
  }

  // Restaurar instâncias ativas do banco de dados
  async restoreActiveInstances() {
    try {
      console.log('🔄 Restaurando instâncias ativas do banco de dados...');
      
      const { supabaseAdmin } = require('./supabase');
      const { data: activeInstances, error } = await supabaseAdmin
        .rpc('get_active_instances');

      if (error) {
        console.error('❌ Erro ao buscar instâncias ativas:', error);
        return;
      }

      console.log(`📱 ${activeInstances.length} instâncias ativas encontradas no banco`);

      for (const instance of activeInstances) {
        try {
          console.log(`🔄 Restaurando instância: ${instance.instance_name} (${instance.status})`);
          
          // Verificar se a instância já está na memória
          if (this.instances.has(instance.instance_name)) {
            console.log(`⚠️ Instância ${instance.instance_name} já está ativa na memória, pulando...`);
            continue;
          }
          
          // Se a instância estava conectada, tentar reconectar
          if (instance.status === 'connected') {
            // Atualizar status para connecting para tentar reconectar
            await supabaseAdmin
              .from('whatsapp_instances')
              .update({ 
                status: 'connecting',
                updated_at: new Date().toISOString()
              })
              .eq('instance_name', instance.instance_name);
            
            // Tentar reconectar
            await this.connectInstance(instance.instance_name);
          } else if (instance.status === 'connecting') {
            // Se estava conectando, tentar conectar novamente
            await this.connectInstance(instance.instance_name);
          }
          
        } catch (restoreError) {
          console.error(`❌ Erro ao restaurar instância ${instance.instance_name}:`, restoreError.message);
          
          // Marcar como desconectada se falhar
          await supabaseAdmin
            .from('whatsapp_instances')
            .update({ 
              status: 'disconnected',
              updated_at: new Date().toISOString()
            })
            .eq('instance_name', instance.instance_name);
        }
      }
      
      console.log('✅ Restauração de instâncias concluída');
      
    } catch (error) {
      console.error('❌ Erro ao restaurar instâncias ativas:', error);
    }
  }

  // Salvar QR code no banco de dados
  async saveQRCode(instanceName, qrCodeDataUrl) {
    try {
      const { supabaseAdmin } = require('./supabase');
      
      const { error } = await supabaseAdmin
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCodeDataUrl,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (error) {
        console.error('❌ Erro ao salvar QR code no banco:', error);
      } else {
        console.log(`✅ QR code salvo no banco para ${instanceName}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar QR code:', error);
    }
  }

  // Obter QR code do banco de dados
  async getQRCodeFromDatabase(instanceName) {
    try {
      const { supabaseAdmin } = require('./supabase');
      
      const { data, error } = await supabaseAdmin
        .from('whatsapp_instances')
        .select('qr_code, status')
        .eq('instance_name', instanceName)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar QR code no banco:', error);
        return null;
      }

      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar QR code:', error);
      return null;
    }
  }

  // Limpar cache de contatos
  clearContactsCache(instanceName = null) {
    if (instanceName) {
      this.contactsCache.delete(instanceName);
      this.cacheExpiry.delete(instanceName);
      console.log(`🗑️ Cache de contatos limpo para ${instanceName}`);
    } else {
      this.contactsCache.clear();
      this.cacheExpiry.clear();
      console.log(`🗑️ Cache de contatos limpo para todas as instâncias`);
    }
  }

  // Forçar atualização do cache de contatos
  async forceRefreshContacts(instanceName) {
    console.log(`🔄 Forçando atualização do cache de contatos para ${instanceName}`);
    this.clearContactsCache(instanceName);
    
    try {
      return await this.getContacts(instanceName);
    } catch (error) {
      console.error(`❌ Erro ao forçar atualização de contatos:`, error);
      throw error;
    }
  }

  // Obter status do cache
  getCacheStatus(instanceName) {
    const cachedContacts = this.contactsCache.get(instanceName);
    const cachedTimestamp = this.cacheExpiry.get(instanceName);
    
    if (!cachedContacts || !cachedTimestamp) {
      return { hasCache: false, isExpired: true, contactsCount: 0 };
    }
    
    const isExpired = Date.now() - cachedTimestamp > this.CACHE_DURATION;
    return {
      hasCache: true,
      isExpired,
      contactsCount: cachedContacts.length,
      lastUpdate: new Date(cachedTimestamp),
      expiresAt: new Date(cachedTimestamp + this.CACHE_DURATION)
    };
  }

  // Método para processar mensagem recebida de forma controlada
  async processReceivedMessage(instanceName, messageData) {
    try {
      console.log(`📨 Processando mensagem recebida de ${messageData.from}: ${messageData.body.substring(0, 50)}...`);
      
      const { supabaseAdmin } = require('./supabase');
      
      // Helper: garantir contato existente
      const ensureContact = async (contactId, displayName = contactId) => {
        const { data: existing, error: findErr } = await supabaseAdmin
          .from('whatsapp_contacts')
          .select('id, has_messages')
          .eq('instance_name', instanceName)
          .eq('id', contactId)
          .single();

        if (existing && !findErr) {
          if (!existing.has_messages) {
            await supabaseAdmin
              .from('whatsapp_contacts')
              .update({ has_messages: true, updated_at: new Date().toISOString() })
              .eq('id', contactId)
              .eq('instance_name', instanceName);
          }
          return existing.id;
        }

        const cleanPhone = (id) => (id || '').replace('@c.us', '').replace('@s.whatsapp.net', '');

        const { data: created, error: createErr } = await supabaseAdmin
          .from('whatsapp_contacts')
          .insert({
            id: contactId,
            instance_name: instanceName,
            phone: cleanPhone(contactId),
            name: displayName,
            has_messages: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        if (createErr) {
          console.error('❌ Erro ao criar contato:', createErr);
          throw createErr;
        }
        console.log(`✅ Novo contato criado: ${created.id} (${displayName})`);
        return created.id;
      };

      // Contato do remetente
      const fromId = messageData.from;
      await ensureContact(fromId, messageData.from);

      // Contato do próprio número (destinatário)
      const client = this.instances.get(instanceName);
      const selfSerialized = (messageData._data?.to || messageData.to) || (client?.info?.wid?._serialized ?? (client?.info?.wid?.user ? `${client.info.wid.user}@c.us` : 'unknown'));
      const toId = selfSerialized;
      if (toId && toId !== 'unknown') {
        await ensureContact(toId, 'Minha conta');
      }
      
      // Salvar a mensagem
      const { error: msgError } = await supabaseAdmin
        .from('whatsapp_messages')
        .insert({
          id: `${instanceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          instance_name: instanceName,
          from_id: fromId,
          to_id: toId || 'unknown',
          body: messageData.body,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'text',
          created_at: new Date().toISOString()
        });
      
      if (msgError) {
        console.error('❌ Erro ao salvar mensagem:', msgError);
        throw msgError;
      } else {
        console.log(`✅ Mensagem processada e salva: ${messageData.body.substring(0, 50)}...`);
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar mensagem recebida:', error);
      throw error;
    }
  }

  // Método para configurar webhook de mensagens (opcional)
  async setupMessageWebhook(instanceName, webhookUrl) {
    try {
      const client = this.instances.get(instanceName);
      if (!client) {
        throw new Error(`Instance ${instanceName} not found`);
      }

      // Configurar webhook apenas para mensagens recebidas
      client.on('message', async (msg) => {
        // Verificar se é uma mensagem recebida (não enviada por nós)
        if (msg.fromMe) {
          console.log(`📤 Mensagem enviada por nós (ignorada): ${msg.body.substring(0, 50)}...`);
          return;
        }

        // Processar mensagem recebida de forma controlada
        await this.processReceivedMessage(instanceName, msg);
      });

      // Listener leve para receber mensagens (apenas inbound)
      client.on('message', async (msg) => {
        try {
          if (msg.fromMe) return;

          const { supabaseAdmin } = require('./supabase');

          const ensureContact = async (contactId, displayName = contactId) => {
            const plain = (contactId || '').replace('@c.us', '').replace('@s.whatsapp.net', '');
            const { data: existing } = await supabaseAdmin
              .from('whatsapp_contacts')
              .select('id')
              .eq('instance_name', instanceName)
              .eq('id', plain)
              .single();
            if (existing) return existing.id;
            const { data: created, error: createErr } = await supabaseAdmin
              .from('whatsapp_contacts')
              .insert({
                id: plain,
                instance_name: instanceName,
                phone: plain,
                name: displayName,
                has_messages: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            if (createErr) throw createErr;
            return created.id;
          };

          const contactFromJid = msg.from.includes('@') ? msg.from : `${msg.from}@c.us`;
          const plainFrom = contactFromJid.replace('@c.us', '').replace('@s.whatsapp.net', '');
          const selfJid = (msg._data?.to || msg.to) || (client.info?.wid?._serialized ?? (client.info?.wid?.user ? `${client.info.wid.user}@c.us` : ''));
          const plainTo = (selfJid || '').replace('@c.us', '').replace('@s.whatsapp.net', '');

          try {
            await ensureContact(plainFrom, msg._data?.notifyName || msg.from);
            if (plainTo) await ensureContact(plainTo, 'Minha conta');
          } catch (ce) {
            console.warn('ensureContact warning:', ce?.message || ce);
          }

          // Salvar no banco de forma mínima
          const ts = msg.timestamp && msg.timestamp > 1000000000 ? msg.timestamp : Math.floor(Date.now() / 1000);
          const { error: insErr } = await supabaseAdmin
            .from('whatsapp_messages')
            .insert({
              id: msg.id?._serialized || `${instanceName}_${Date.now()}`,
              instance_name: instanceName,
              from_id: plainFrom,
              to_id: plainTo || null,
              body: msg.body || '',
              type: msg.type || 'chat',
              timestamp: ts,
              is_from_me: false,
              status: 'received',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          if (insErr) {
            console.warn('Falha ao inserir mensagem inbound (seguindo):', insErr.message);
          }

          // Publicar evento SSE
          const events = require('./events');
          events.publish(instanceName, contactFromJid, {
            kind: 'message',
            direction: 'inbound',
            id: msg.id?._serialized,
            body: msg.body,
            timestamp: ts,
            is_from_me: false,
            status: 'received',
          });
        } catch (e) {
          // silencioso para não interromper o fluxo do cliente
        }
      });

      // Atualizar status de mensagem enviada (ACK)
      client.on('message_ack', (msg, ack) => {
        try {
          if (!msg.fromMe) return;
          const events = require('./events');
          const contactId = msg.to || msg.id.remote || '';
          if (!contactId) return;
          const id = msg.id?._serialized || undefined;
          events.publish(instanceName, contactId, {
            kind: 'ack',
            id,
            ack
          });
        } catch {}
      });

      console.log(`✅ Webhook de mensagens configurado para ${instanceName}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao configurar webhook para ${instanceName}:`, error);
      throw error;
    }
  }
}

module.exports = new EvolutionApiService(); 