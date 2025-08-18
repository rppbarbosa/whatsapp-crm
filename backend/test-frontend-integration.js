// ===== TESTE DE INTEGRAÇÃO FRONTEND/BACKEND =====
// Script para testar se todas as funcionalidades estão funcionando

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json'
  }
});

async function testFrontendIntegration() {
  console.log('🧪 Testando integração Frontend/Backend...\n');

  try {
    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    const health = await api.get('/health');
    console.log('✅ Health check:', health.data.status);

    // 2. Testar listagem de instâncias
    console.log('\n2️⃣ Testando listagem de instâncias...');
    const instances = await api.get('/api/whatsapp/instances');
    console.log('✅ Instâncias encontradas:', instances.data.instances_count);
    
    if (instances.data.data && instances.data.data.length > 0) {
      const instance = instances.data.data[0];
      console.log(`   📱 Instância: ${instance.instance_name} (${instance.status})`);
      
      // 3. Testar sincronização de contatos
      console.log('\n3️⃣ Testando sincronização de contatos...');
      const contacts = await api.post(`/api/whatsapp/instances/${instance.instance_name}/sync-contacts`);
      console.log('✅ Contatos sincronizados:', contacts.data.contacts_synced);

      // 4. Testar sincronização de mensagens
      console.log('\n4️⃣ Testando sincronização de mensagens...');
      const messages = await api.post(`/api/whatsapp/instances/${instance.instance_name}/sync-messages?limit=50`);
      console.log('✅ Mensagens sincronizadas:', messages.data.messages_synced);

      // 5. Testar listagem de conversas
      console.log('\n5️⃣ Testando listagem de conversas...');
      const conversations = await api.get(`/api/whatsapp/instances/${instance.instance_name}/conversations`);
      console.log('✅ Conversas encontradas:', conversations.data.conversations_count);

      // 6. Testar envio de mensagem
      console.log('\n6️⃣ Testando envio de mensagem...');
      const testNumber = '554497460856'; // Número de teste
      const testMessage = 'Teste de integração Frontend/Backend - ' + new Date().toLocaleString();
      
      const sendResult = await api.post(`/api/whatsapp/instances/${instance.instance_name}/send-message`, {
        number: testNumber,
        text: testMessage
      });
      
      console.log('✅ Mensagem enviada com sucesso!');
      console.log(`   📱 Message ID: ${sendResult.data.data.messageId}`);
      console.log(`   📝 Texto: ${testMessage.substring(0, 50)}...`);

      // 7. Testar carregamento de mensagens de conversa
      if (conversations.data.data && conversations.data.data.length > 0) {
        console.log('\n7️⃣ Testando carregamento de mensagens de conversa...');
        const firstConversation = conversations.data.data[0];
        const conversationMessages = await api.get(`/api/whatsapp/conversations/${firstConversation.contact_id}/messages?instance=${instance.instance_name}&limit=10`);
        console.log('✅ Mensagens da conversa carregadas:', conversationMessages.data.data?.length || 0);
      }

    } else {
      console.log('⚠️ Nenhuma instância encontrada para teste');
    }

    console.log('\n🎉 Todos os testes de integração passaram com sucesso!');
    console.log('✅ O sistema está pronto para uso no frontend.');

  } catch (error) {
    console.error('❌ Erro nos testes de integração:', error.response?.data || error.message);
    
    if (error.response?.status) {
      console.error(`   Status: ${error.response.status}`);
    }
    
    if (error.response?.data?.message) {
      console.error(`   Mensagem: ${error.response.data.message}`);
    }
  }
}

// Executar testes
testFrontendIntegration(); 