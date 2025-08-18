require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'whatsapp-crm-evolution-key-2024-secure',
  },
});

async function testMessageSave() {
  console.log('🧪 Testando salvamento automático de mensagens...\n');

  try {
    // 1. Verificar instâncias
    console.log('1️⃣ Verificando instâncias...');
    const instances = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias:', instances.data.length);
    instances.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

    // 2. Verificar conversas antes
    console.log('\n2️⃣ Verificando conversas antes...');
    const conversationsBefore = await api.get('/api/conversations');
    console.log('📋 Conversas antes:', conversationsBefore.data.length);

    // 3. Verificar mensagens antes (usando conversas)
    console.log('\n3️⃣ Verificando mensagens antes...');
    let totalMessagesBefore = 0;
    for (const conv of conversationsBefore.data) {
      try {
        const messages = await api.get(`/api/conversations/${conv.id}/messages`);
        totalMessagesBefore += messages.data.length;
      } catch (error) {
        console.log(`   Erro ao buscar mensagens da conversa ${conv.id}:`, error.response?.data?.error || error.message);
      }
    }
    console.log('💬 Total de mensagens antes:', totalMessagesBefore);

    // 4. Simular recebimento de mensagem (se houver instância conectada)
    const connectedInstance = instances.data.find(inst => inst.instance.status === 'connected');
    
    if (connectedInstance) {
      console.log(`\n4️⃣ Instância conectada encontrada: ${connectedInstance.instance.instanceName}`);
      console.log('   Para testar, envie uma mensagem para o WhatsApp desta instância');
      console.log('   e verifique se ela aparece automaticamente no banco de dados.');
    } else {
      console.log('\n4️⃣ Nenhuma instância conectada encontrada');
      console.log('   Conecte uma instância primeiro para testar o salvamento de mensagens');
    }

    // 5. Aguardar e verificar novamente
    console.log('\n5️⃣ Aguardando 10 segundos...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 6. Verificar conversas depois
    console.log('\n6️⃣ Verificando conversas depois...');
    const conversationsAfter = await api.get('/api/conversations');
    console.log('📋 Conversas depois:', conversationsAfter.data.length);

    // 7. Verificar mensagens depois (usando conversas)
    console.log('\n7️⃣ Verificando mensagens depois...');
    let totalMessagesAfter = 0;
    for (const conv of conversationsAfter.data) {
      try {
        const messages = await api.get(`/api/conversations/${conv.id}/messages`);
        totalMessagesAfter += messages.data.length;
      } catch (error) {
        console.log(`   Erro ao buscar mensagens da conversa ${conv.id}:`, error.response?.data?.error || error.message);
      }
    }
    console.log('💬 Total de mensagens depois:', totalMessagesAfter);

    // 8. Mostrar diferenças
    if (conversationsAfter.data.length > conversationsBefore.data.length) {
      console.log('\n✅ Novas conversas criadas!');
      const newConversations = conversationsAfter.data.filter(conv => 
        !conversationsBefore.data.some(oldConv => oldConv.id === conv.id)
      );
      newConversations.forEach(conv => {
        console.log(`   - ${conv.whatsapp_number} (${conv.whatsapp_instance})`);
      });
    }

    if (totalMessagesAfter > totalMessagesBefore) {
      console.log('\n✅ Novas mensagens salvas!');
      console.log(`   Total de novas mensagens: ${totalMessagesAfter - totalMessagesBefore}`);
    }

    // 9. Mostrar detalhes das conversas com mensagens
    console.log('\n📊 Detalhes das conversas:');
    for (const conv of conversationsAfter.data) {
      try {
        const messages = await api.get(`/api/conversations/${conv.id}/messages`);
        console.log(`   - ${conv.whatsapp_number} (${conv.whatsapp_instance}): ${messages.data.length} mensagens`);
        if (messages.data.length > 0) {
          const lastMessage = messages.data[messages.data.length - 1];
          console.log(`     Última: "${lastMessage.content.substring(0, 50)}..." (${lastMessage.sender_type})`);
        }
      } catch (error) {
        console.log(`   - ${conv.whatsapp_number} (${conv.whatsapp_instance}): Erro ao buscar mensagens`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testMessageSave(); 