const axios = require('axios');

async function testFilenamePreservation() {
  try {
    console.log('🔍 Testando preservação de nomes de arquivo...\n');

    const apiKey = 'whatsapp-crm-evolution-key-2024-secure';
    const headers = { 'apikey': apiKey };

    // Verificar status do WhatsApp
    const statusResponse = await axios.get('http://localhost:3001/api/whatsapp/status', { headers });
    if (!statusResponse.data.success || !statusResponse.data.data.isReady) {
      console.log('⚠️ WhatsApp não está conectado. Conecte primeiro.');
      return;
    }

    // Obter conversas
    const chatsResponse = await axios.get('http://localhost:3001/api/whatsapp/chats', { headers });
    if (!chatsResponse.data.success || chatsResponse.data.data.length === 0) {
      console.log('⚠️ Nenhuma conversa encontrada.');
      return;
    }

    const firstChat = chatsResponse.data.data[0];
    console.log(`📱 Testando conversa: ${firstChat.name} (${firstChat.id})`);

    // Obter mensagens da primeira conversa
    const messagesResponse = await axios.get(`http://localhost:3001/api/whatsapp/chats/${firstChat.id}/messages?limit=20`, { headers });
    if (!messagesResponse.data.success) {
      console.log('⚠️ Erro ao obter mensagens.');
      return;
    }

    const messages = messagesResponse.data.data;
    console.log(`📨 Total de mensagens: ${messages.length}\n`);

    // Analisar mensagens com mídia
    const mediaMessages = messages.filter(msg => msg.mediaInfo && msg.mediaInfo.hasMedia);
    console.log(`📎 Mensagens com mídia: ${mediaMessages.length}\n`);

    if (mediaMessages.length === 0) {
      console.log('⚠️ Nenhuma mensagem com mídia encontrada para teste.');
      return;
    }

    // Analisar cada mensagem de mídia
    mediaMessages.forEach((msg, index) => {
      console.log(`--- Mensagem ${index + 1} ---`);
      console.log(`ID: ${msg.id}`);
      console.log(`Tipo: ${msg.type}`);
      console.log(`Filename: ${msg.mediaInfo.filename || 'N/A'}`);
      console.log(`Mimetype: ${msg.mediaInfo.mimetype || 'N/A'}`);
      console.log(`Tamanho: ${msg.mediaInfo.size ? Math.round(msg.mediaInfo.size / 1024) + ' KB' : 'N/A'}`);
      console.log(`Tem URL: ${msg.mediaInfo.url ? 'Sim' : 'Não'}`);
      
      // Verificar se o filename é original ou gerado
      if (msg.mediaInfo.filename) {
        if (msg.mediaInfo.filename.includes('media_') && msg.mediaInfo.filename.includes('@c.us_')) {
          console.log(`⚠️ Filename gerado pelo sistema (não original)`);
        } else {
          console.log(`✅ Filename parece ser original`);
        }
      }
      console.log('');
    });

    console.log('✅ Teste de preservação de nomes concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFilenamePreservation();
