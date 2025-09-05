const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Teste básico de integração com whatsapp-web.js
async function testWhatsAppIntegration() {
  console.log('🧪 Iniciando teste de integração com WhatsApp Web...');
  
  try {
    // Criar cliente de teste
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'test-integration',
        dataPath: './auth_info/test'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
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
          '--max_old_space_size=4096'
        ],
        timeout: 30000,
        protocolTimeout: 30000
      }
    });

    // Configurar eventos
    client.on('qr', (qr) => {
      console.log('📱 QR Code recebido:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      console.log('✅ Cliente WhatsApp Web conectado!');
      console.log('📱 Informações do usuário:', client.info);
      
      // Testar obtenção de chats
      testGetChats(client);
      
      // Testar envio de mensagem
      setTimeout(() => {
        testSendMessage(client);
      }, 3000);
    });

    client.on('message', (message) => {
      console.log('📨 Mensagem recebida:', {
        from: message.from,
        body: message.body,
        type: message.type,
        timestamp: new Date(message.timestamp * 1000),
        fromMe: message.fromMe
      });
    });

    client.on('message_create', (message) => {
      if (message.fromMe) {
        console.log('📤 Mensagem enviada por nós:', {
          to: message.to,
          body: message.body,
          type: message.type,
          timestamp: new Date(message.timestamp * 1000),
          fromMe: message.fromMe
        });
      } else {
        console.log('📨 Nova mensagem criada (não enviada por nós):', {
          from: message.from,
          body: message.body,
          type: message.type,
          timestamp: new Date(message.timestamp * 1000),
          fromMe: message.fromMe
        });
      }
    });

    client.on('disconnected', (reason) => {
      console.log('❌ Cliente desconectado:', reason);
    });

    // Inicializar cliente
    await client.initialize();
    
  } catch (error) {
    console.error('❌ Erro no teste de integração:', error);
  }
}

// Testar obtenção de chats
async function testGetChats(client) {
  try {
    console.log('🔄 Testando obtenção de chats...');
    
    const chats = await client.getChats();
    console.log(`✅ ${chats.length} chats encontrados`);
    
    // Mostrar informações dos primeiros 3 chats
    chats.slice(0, 3).forEach((chat, index) => {
      console.log(`📱 Chat ${index + 1}:`, {
        id: chat.id._serialized,
        name: chat.name || chat.id.user,
        isGroup: chat.isGroup,
        lastMessage: chat.lastMessage ? {
          body: chat.lastMessage.body?.substring(0, 50) + '...',
          timestamp: new Date(chat.lastMessage.timestamp * 1000)
        } : null
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter chats:', error);
  }
}

// Testar envio de mensagem
async function testSendMessage(client) {
  try {
    console.log('📤 Testando envio de mensagem...');
    
    // Enviar mensagem para o próprio número (teste)
    const ownNumber = client.info.wid._serialized;
    const testMessage = '🧪 Esta é uma mensagem de teste do backend! ' + new Date().toLocaleString();
    
    console.log(`📱 Enviando mensagem de teste para: ${ownNumber}`);
    console.log(`📝 Conteúdo: ${testMessage}`);
    
    const result = await client.sendMessage(ownNumber, testMessage);
    
    console.log('✅ Mensagem de teste enviada com sucesso!');
    console.log('🆔 ID da mensagem:', result.key.id);
    console.log('⏰ Aguarde alguns segundos para ver o evento message_create...');
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testWhatsAppIntegration().catch(console.error);
}

module.exports = { testWhatsAppIntegration };
