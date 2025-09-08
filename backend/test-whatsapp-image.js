const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testWhatsAppImage() {
  try {
    console.log('🧪 Testando envio da imagem do WhatsApp...');

    // 1. Verificar status
    console.log('\n1. Verificando status do WhatsApp...');
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: { 'apikey': 'whatsapp-crm-evolution-key-2024-secure' }
    });
    
    if (!statusResponse.data.success || !statusResponse.data.data.isReady) {
      console.log('⚠️ WhatsApp não está conectado');
      return;
    }
    console.log('✅ WhatsApp conectado');

    // 2. Ler a imagem real do WhatsApp
    const imagePath = path.join(process.env.USERPROFILE, 'Downloads', 'WhatsApp Image 2025-08-21 at 13.49.51.jpeg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Imagem não encontrada em:', imagePath);
      console.log('📁 Verificando Downloads...');
      const downloadsPath = path.join(process.env.USERPROFILE, 'Downloads');
      const files = fs.readdirSync(downloadsPath).filter(f => f.includes('WhatsApp'));
      console.log('📁 Arquivos do WhatsApp encontrados:', files);
      return;
    }

    // 3. Ler e converter para base64
    console.log('\n2. Lendo imagem...');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`📊 Arquivo original: ${imageBuffer.length} bytes`);
    console.log(`📊 Base64: ${base64Image.length} caracteres`);

    // 4. Enviar imagem
    console.log('\n3. Enviando imagem...');
    const sendResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', {
      to: '554497460856@c.us',
      media: base64Image,
      filename: 'WhatsApp Image 2025-08-21 at 13.49.51.jpeg',
      mimetype: 'image/jpeg',
      caption: 'Teste com imagem real do WhatsApp (294KB)'
    }, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });

    console.log('\n4. Resultado do envio:');
    console.log('📤 Sucesso:', sendResponse.data.success);
    if (sendResponse.data.success) {
      console.log('📤 Message ID:', sendResponse.data.data.messageId);
      console.log('📤 Timestamp:', sendResponse.data.data.timestamp);
    } else {
      console.log('❌ Erro:', sendResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testWhatsAppImage();
