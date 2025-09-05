const axios = require('axios');
const { supabaseAdmin } = require('./supabase');

class EvolutionApiV2Service {
  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';
    this.instances = new Map();
    this.qrCodes = new Map();
    this.logs = new Map();
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

  // Criar instância seguindo a documentação oficial
  async createInstance(instanceName, webhookUrl = null) {
    try {
      if (!instanceName) {
        throw new Error('instanceName is required');
      }

      if (this.instances.has(instanceName)) {
        throw new Error('Instance already exists');
      }

      this.addLog(instanceName, 'Creating instance via Evolution API...', 'info');
      console.log(`🔧 Criando instância ${instanceName} via Evolution API...`);

      // Configuração conforme documentação oficial
      const instanceConfig = {
        instanceName: instanceName,
        token: `${instanceName}-token-${Date.now()}`, // Token único
        number: null, // Será definido após conexão
        qrcode: true, // Habilitar QR code para conexão inicial
        integration: "EVOLUTION" // Conforme documentação oficial
      };

      console.log(`📋 Configuração da instância:`, instanceConfig);

      // Criar instância via Evolution API
      const response = await axios.post(`${this.baseUrl}/instance/create`, instanceConfig, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log(`✅ Instância ${instanceName} criada com sucesso via Evolution API`);
        this.addLog(instanceName, 'Instance created successfully via Evolution API', 'success');

        // Salvar instância na memória
        this.instances.set(instanceName, {
          instanceName,
          status: 'connecting',
          qrcode: null,
          phone_number: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Salvar no banco de dados
        try {
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
            console.log(`✅ Instância ${instanceName} salva no banco de dados`);
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
      } else {
        throw new Error(`Evolution API retornou status: ${response.data?.status}`);
      }

    } catch (error) {
      this.addLog(instanceName, `Error creating instance: ${error.message}`, 'error');
      console.error('❌ Erro ao criar instância via Evolution API:', error);
      throw error;
    }
  }

  // Listar instâncias
  getInstances() {
    return Array.from(this.instances.values()).map(instance => ({
      instance: {
        instanceName: instance.instanceName,
        status: instance.status,
        qrcode: instance.qrcode,
        phone_number: instance.phone_number,
        logs: this.logs.get(instance.instanceName) || [],
        lastActivity: this.logs.get(instance.instanceName)?.slice(-1)[0]?.timestamp || null
      }
    }));
  }

  // Conectar instância (gerar QR code)
  async connectInstance(instanceName) {
    try {
      if (!this.instances.has(instanceName)) {
        throw new Error('Instance not found');
      }

      const instance = this.instances.get(instanceName);
      
      if (instance.status === 'connected') {
        return {
          instance: {
            instanceName,
            status: 'connected',
            phone_number: instance.phone_number
          }
        };
      }

      // Verificar se já tem QR code
      if (instance.qrcode) {
        return {
          instance: {
            instanceName,
            status: 'connecting',
            qrcode: instance.qrcode
          }
        };
      }

      // Buscar QR code da Evolution API
      try {
        const response = await axios.get(`${this.baseUrl}/instance/connect/${instanceName}`, {
          headers: {
            'apikey': this.apiKey
          }
        });

        if (response.data && response.data.qrcode) {
          instance.qrcode = response.data.qrcode;
          instance.status = 'connecting';
          instance.updated_at = new Date().toISOString();

          console.log(`✅ QR code obtido para instância ${instanceName}`);
          this.addLog(instanceName, 'QR code obtained from Evolution API', 'success');

          return {
            instance: {
              instanceName,
              status: 'connecting',
              qrcode: instance.qrcode
            }
          };
        } else {
          throw new Error('QR code not received from Evolution API');
        }
      } catch (qrError) {
        console.error(`❌ Erro ao obter QR code:`, qrError);
        throw qrError;
      }

    } catch (error) {
      this.addLog(instanceName, `Error connecting instance: ${error.message}`, 'error');
      console.error('❌ Erro ao conectar instância:', error);
      throw error;
    }
  }

  // Verificar status da instância
  async checkInstanceStatus(instanceName) {
    try {
      if (!this.instances.has(instanceName)) {
        throw new Error('Instance not found');
      }

      const response = await axios.get(`${this.baseUrl}/instance/status/${instanceName}`, {
        headers: {
          'apikey': this.apiKey
        }
      });

      if (response.data) {
        const instance = this.instances.get(instanceName);
        const newStatus = response.data.status || instance.status;
        
        // Atualizar status se mudou
        if (newStatus !== instance.status) {
          instance.status = newStatus;
          instance.updated_at = new Date().toISOString();
          
          if (newStatus === 'connected') {
            instance.phone_number = response.data.phone || null;
            instance.qrcode = null; // Limpar QR code quando conectado
          }

          this.addLog(instanceName, `Status updated to: ${newStatus}`, 'info');
          console.log(`📱 Status da instância ${instanceName} atualizado para: ${newStatus}`);

          // Atualizar no banco
          try {
            await supabaseAdmin
              .from('whatsapp_instances')
              .update({
                status: newStatus,
                phone_number: instance.phone_number,
                updated_at: new Date().toISOString()
              })
              .eq('instance_name', instanceName);
          } catch (dbError) {
            console.error('❌ Erro ao atualizar status no banco:', dbError);
          }
        }

        return {
          instance: {
            instanceName,
            status: instance.status,
            qrcode: instance.qrcode,
            phone_number: instance.phone_number
          }
        };
      }

      throw new Error('Invalid response from Evolution API');

    } catch (error) {
      console.error(`❌ Erro ao verificar status da instância ${instanceName}:`, error);
      throw error;
    }
  }

  // Enviar mensagem via Evolution API
  async sendMessage(instanceName, number, text) {
    try {
      if (!this.instances.has(instanceName)) {
        throw new Error('Instance not found');
      }

      const instance = this.instances.get(instanceName);
      if (instance.status !== 'connected') {
        throw new Error('Instance is not connected');
      }

      // Limpar e validar o número de telefone
      let cleanNumber = number.toString().trim().replace(/[^\d]/g, '');
      
      if (cleanNumber.length < 10) {
        throw new Error(`Invalid phone number: ${number}. Must have at least 10 digits.`);
      }

      // Adicionar código do país se não estiver presente (assumindo Brasil +55)
      if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
        cleanNumber = '55' + cleanNumber;
      }

      console.log(`📤 Enviando mensagem via Evolution API: ${instanceName} -> ${cleanNumber}`);

      const messageData = {
        number: cleanNumber,
        textMessage: {
          text: text
        }
      };

      const response = await axios.post(`${this.baseUrl}/message/sendText/${instanceName}`, messageData, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log(`✅ Mensagem enviada com sucesso via Evolution API`);
        this.addLog(instanceName, `Message sent to ${cleanNumber}: ${text.substring(0, 30)}...`, 'success');

        return {
          message: 'Message sent successfully',
          messageId: response.data.messageId || `${instanceName}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          chatId: `${cleanNumber}@c.us`,
          originalNumber: number,
          cleanNumber: cleanNumber
        };
      } else {
        throw new Error(`Evolution API retornou status: ${response.data?.status}`);
      }

    } catch (error) {
      this.addLog(instanceName, `Error sending message: ${error.message}`, 'error');
      console.error('❌ Erro ao enviar mensagem via Evolution API:', error);
      throw error;
    }
  }

  // Deletar instância
  async deleteInstance(instanceName) {
    try {
      if (!this.instances.has(instanceName)) {
        throw new Error('Instance not found');
      }

      console.log(`🗑️ Deletando instância ${instanceName} via Evolution API...`);

      const response = await axios.delete(`${this.baseUrl}/instance/delete/${instanceName}`, {
        headers: {
          'apikey': this.apiKey
        }
      });

      if (response.data && response.data.status === 'success') {
        // Remover da memória
        this.instances.delete(instanceName);
        this.qrCodes.delete(instanceName);
        this.logs.delete(instanceName);

        console.log(`✅ Instância ${instanceName} deletada com sucesso`);
        this.addLog(instanceName, 'Instance deleted successfully', 'info');

        return { 
          message: 'Instance deleted successfully' 
        };
      } else {
        throw new Error(`Evolution API retornou status: ${response.data?.status}`);
      }

    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error);
      throw error;
    }
  }

  // Health check
  getHealth() {
    return {
      status: 'OK',
      message: 'Evolution API V2 Service is running',
      timestamp: new Date().toISOString(),
      instances: this.instances.size,
      version: '2.0.0',
      baseUrl: this.baseUrl
    };
  }

  // Verificar se a Evolution API está disponível
  async checkApiHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });

      return {
        available: true,
        status: response.data?.status || 'unknown',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new EvolutionApiV2Service(); 
module.exports = new EvolutionApiV2Service(); 