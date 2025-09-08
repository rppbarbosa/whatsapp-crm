const axios = require('axios');

async function testMediaQuality() {
  try {
    console.log('🧪 Testando qualidade de mídias...');
    
    // 1. Testar status do WhatsApp
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
    
    // 2. Obter mensagens para analisar mídias
    console.log('\n2. Obtendo mensagens com mídias...');
    const messagesResponse = await axios.get('http://localhost:3001/api/whatsapp/chats/554497460856@c.us/messages?limit=20', {
      headers: {
        'apikey': 'whatsapp-crm-evolution-key-2024-secure'
      }
    });
    
    if (messagesResponse.data.success && messagesResponse.data.data) {
      const messages = messagesResponse.data.data;
      console.log(`✅ ${messages.length} mensagens obtidas`);
      
      // Filtrar mensagens com mídia
      const mediaMessages = messages.filter(msg => 
        msg.type !== 'text' && 
        (msg.mediaInfo || msg.body?.length > 1000)
      );
      
      console.log(`📱 ${mediaMessages.length} mensagens com mídia encontradas`);
      
      // Analisar cada mídia
      mediaMessages.forEach((msg, index) => {
        console.log(`\n📱 Mídia ${index + 1}:`);
        console.log(`  - ID: ${msg.id}`);
        console.log(`  - Tipo: ${msg.type}`);
        console.log(`  - Tem mediaInfo: ${!!msg.mediaInfo}`);
        
        if (msg.mediaInfo) {
          console.log(`  - Filename: ${msg.mediaInfo.filename}`);
          console.log(`  - Mimetype: ${msg.mediaInfo.mimetype}`);
          console.log(`  - Size: ${msg.mediaInfo.size} bytes`);
          console.log(`  - URL length: ${msg.mediaInfo.url?.length || 0} caracteres`);
          
          // Calcular tamanho aproximado da imagem decodificada
          if (msg.mediaInfo.url) {
            const decodedSize = (msg.mediaInfo.url.length * 3) / 4;
            console.log(`  - Tamanho decodificado estimado: ${Math.round(decodedSize)} bytes`);
            
            if (decodedSize < 5000) {
              console.log(`  - ⚠️ POSSÍVEL THUMBNAIL (muito pequeno)`);
            } else {
              console.log(`  - ✅ Tamanho normal`);
            }
          }
        } else if (msg.body?.length > 1000) {
          console.log(`  - Body length: ${msg.body.length} caracteres (possível base64)`);
          const decodedSize = (msg.body.length * 3) / 4;
          console.log(`  - Tamanho decodificado estimado: ${Math.round(decodedSize)} bytes`);
          
          if (decodedSize < 5000) {
            console.log(`  - ⚠️ POSSÍVEL THUMBNAIL (muito pequeno)`);
          } else {
            console.log(`  - ✅ Tamanho normal`);
          }
        }
      });
      
      // 3. Testar envio de imagem de teste
      console.log('\n3. Testando envio de imagem de alta qualidade...');
      
      // Criar uma imagem base64 de teste maior (200x200px PNG)
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // Placeholder pequeno
      
      const mediaData = {
        to: '554497460856@c.us',
        media: testImageBase64,
        filename: 'test-high-quality.png',
        mimetype: 'image/png',
        caption: 'Teste de qualidade de mídia'
      };
      
      const sendResponse = await axios.post('http://localhost:3001/api/whatsapp/send-media', mediaData, {
        headers: {
          'apikey': 'whatsapp-crm-evolution-key-2024-secure',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Resultado do envio:', sendResponse.data);
      
    } else {
      console.log('❌ Erro ao obter mensagens:', messagesResponse.data);
    }
    
    console.log('\n🎉 Análise de qualidade concluída!');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.response?.data || error.message);
  }
}

testMediaQuality();
