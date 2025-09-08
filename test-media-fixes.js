const axios = require('axios');

async function testMediaFixes() {
  try {
    console.log('🧪 Testando correções de mídia...');
    
    // 1. Testar status do WhatsApp
    console.log('\n1. Verificando status do WhatsApp...');
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Status:', statusResponse.data);
    
    if (!statusResponse.data.success || statusResponse.data.data !== 'isLogged') {
      console.log('⚠️ WhatsApp não está conectado. Conecte primeiro.');
      return;
    }
    
    // 2. Testar envio de imagem pequena
    console.log('\n2. Testando envio de imagem...');
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
    
    const mediaData = {
      to: '554497460856@c.us',
      media: testImageBase64,
      filename: 'test-image.png',
      mimetype: 'image/png',
      caption: 'Teste de envio de mídia corrigido'
    };
    
    const mediaResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', mediaData, {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Envio de mídia:', mediaResponse.data);
    
    // 3. Testar obtenção de conversas
    console.log('\n3. Testando obtenção de conversas...');
    const chatsResponse = await axios.get('http://localhost:3001/api/whatsapp/chats', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Conversas obtidas:', chatsResponse.data.data?.length || 0, 'conversas');
    
    // 4. Testar obtenção de mensagens
    console.log('\n4. Testando obtenção de mensagens...');
    const messagesResponse = await axios.get('http://localhost:3001/api/whatsapp/chats/554497460856@c.us/messages?limit=10', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    console.log('✅ Mensagens obtidas:', messagesResponse.data.data?.length || 0, 'mensagens');
    
    console.log('\n🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Dica: Verifique os logs do backend para mais detalhes sobre o erro 400.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: O backend não está rodando. Execute: cd backend && npm start');
    }
  }
}

testMediaFixes();
