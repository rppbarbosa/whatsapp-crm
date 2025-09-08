const axios = require('axios');

async function testWPPConnectMethods() {
  try {
    console.log('🧪 Testando métodos WPPConnect...');
    
    // Testar status
    console.log('\n1. Testando status...');
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Status:', statusResponse.data);
    
    // Testar envio de mídia (imagem pequena de teste)
    console.log('\n2. Testando envio de mídia...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
    
    const mediaData = {
      to: '554497460856@c.us',
      media: testImageBase64,
      filename: 'test-image.png',
      mimetype: 'image/png',
      caption: 'Teste de envio de mídia'
    };
    
    const mediaResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', mediaData, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Envio de mídia:', mediaResponse.data);
    
    // Testar obtenção de conversas
    console.log('\n3. Testando obtenção de conversas...');
    const chatsResponse = await axios.get('http://localhost:3001/api/whatsapp/chats', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Conversas obtidas:', chatsResponse.data.data?.length || 0, 'conversas');
    
    console.log('\n🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Dica: Verifique se o WhatsApp está conectado e se os parâmetros estão corretos.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: O backend não está rodando. Execute: cd backend && npm start');
    }
  }
}

testWPPConnectMethods();
