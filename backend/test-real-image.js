const axios = require('axios');

async function testRealImage() {
  try {
    console.log('🧪 Testando envio de imagem real...');

    // 1. Verificar status
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: { 'apikey': 'whatsapp-crm-evolution-key-2024-secure' }
    });
    
    if (!statusResponse.data.success || !statusResponse.data.data.isReady) {
      console.log('⚠️ WhatsApp não está conectado');
      return;
    }

    // 2. Imagem real (100x100 pixels, ~2KB)
    const realImageBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    console.log(`📊 Imagem real: ${realImageBase64.length} caracteres base64`);

    // 3. Testar envio
    const sendResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', {
      to: '554497460856@c.us',
      media: realImageBase64,
      filename: 'test-real.jpg',
      mimetype: 'image/jpeg',
      caption: 'Teste com imagem real'
    }, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });

    console.log('📤 Resultado:', sendResponse.data);

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testRealImage();
