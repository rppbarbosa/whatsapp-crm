const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Testando backend...');
    
    // Testar status
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    
    console.log('✅ Status do backend:', statusResponse.data);
    
    // Testar envio de mídia (simulado)
    const testMedia = {
      to: '554497460856@c.us',
      media: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel PNG
      filename: 'test.png',
      mimetype: 'image/png',
      caption: 'Teste'
    };
    
    const mediaResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', testMedia, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Envio de mídia:', mediaResponse.data);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testBackend();
