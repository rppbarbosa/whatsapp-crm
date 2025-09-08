const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testSendSimple() {
  try {
    console.log('🧪 Testando envio simples de mídia...');

    // 1. Verificar status
    console.log('\n1. Verificando status do WhatsApp...');
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Status:', statusResponse.data);
    
    if (!statusResponse.data.success || !statusResponse.data.data.isReady) {
      console.log('⚠️ WhatsApp não está conectado. Conecte primeiro.');
      return;
    }

    // 2. Criar uma imagem de teste simples (1x1 pixel PNG)
    console.log('\n2. Criando imagem de teste...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    console.log(`📊 Imagem criada: ${testImageBuffer.length} bytes`);

    // 3. Testar envio
    console.log('\n3. Testando envio de imagem...');
    const sendResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', {
      to: '554497460856@c.us',
      media: testImageBase64,
      filename: 'test-simple.png',
      mimetype: 'image/png',
      caption: 'Teste de envio simples'
    }, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });

    console.log('📤 Resultado do envio:', sendResponse.data);

    if (sendResponse.data.success) {
      console.log('✅ Envio bem-sucedido!');
    } else {
      console.log('❌ Falha no envio:', sendResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testSendSimple();
