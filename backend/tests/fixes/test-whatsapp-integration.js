require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  },
});

async function testWhatsAppIntegration() {
  console.log('🧪 Testando integração do WhatsApp...\n');

  try {
    // 1. Testar carregamento de instâncias
    console.log('1️⃣ Testando carregamento de instâncias...');
    const instancesResponse = await api.get('/api/whatsapp/instances');
    console.log('✅ Instâncias carregadas:', instancesResponse.data?.length || 0);
    
    if (instancesResponse.data && instancesResponse.data.length > 0) {
      console.log('📱 Instâncias disponíveis:');
      instancesResponse.data.forEach(inst => {
        console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
      });
    }

    // 2. Testar carregamento de conversas
    console.log('\n2️⃣ Testando carregamento de conversas...');
    const conversationsResponse = await api.get('/api/conversations');
    console.log('✅ Conversas carregadas:', conversationsResponse.data?.length || 0);
    
    if (conversationsResponse.data && conversationsResponse.data.length > 0) {
      console.log('💬 Conversas disponíveis:');
      conversationsResponse.data.slice(0, 3).forEach(conv => {
        console.log(`   - ${conv.customer_name || conv.lead_name || conv.whatsapp_number} (${conv.whatsapp_instance})`);
      });
    }

    // 3. Testar carregamento de mensagens (se houver conversas)
    if (conversationsResponse.data && conversationsResponse.data.length > 0) {
      const firstConversation = conversationsResponse.data[0];
      console.log(`\n3️⃣ Testando carregamento de mensagens da conversa ${firstConversation.id}...`);
      
      const messagesResponse = await api.get(`/api/conversations/${firstConversation.id}/messages`);
      console.log('✅ Mensagens carregadas:', messagesResponse.data?.length || 0);
      
      if (messagesResponse.data && messagesResponse.data.length > 0) {
        console.log('📨 Primeiras mensagens:');
        messagesResponse.data.slice(0, 2).forEach(msg => {
          console.log(`   - ${msg.sender_type}: ${msg.content.substring(0, 50)}...`);
        });
      }
    }

    // 4. Testar carregamento de clientes
    console.log('\n4️⃣ Testando carregamento de clientes...');
    const customersResponse = await api.get('/api/customers');
    console.log('✅ Clientes carregados:', customersResponse.data?.length || 0);

    // 5. Testar carregamento de leads
    console.log('\n5️⃣ Testando carregamento de leads...');
    const leadsResponse = await api.get('/api/leads');
    console.log('✅ Leads carregados:', leadsResponse.data?.length || 0);

    console.log('\n🎉 Todos os testes passaram! A integração está funcionando corretamente.');
    
    // Resumo final
    console.log('\n📊 Resumo da integração:');
    console.log(`   - Instâncias: ${instancesResponse.data?.length || 0}`);
    console.log(`   - Conversas: ${conversationsResponse.data?.length || 0}`);
    console.log(`   - Clientes: ${customersResponse.data?.length || 0}`);
    console.log(`   - Leads: ${leadsResponse.data?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Dica: Verifique se o backend está rodando e se as rotas estão configuradas corretamente.');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Dica: Verifique se a API_KEY está configurada corretamente.');
    }
  }
}

// Executar testes
testWhatsAppIntegration(); 