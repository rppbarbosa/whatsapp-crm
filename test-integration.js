const axios = require('axios');

// Configuração
const API_BASE_URL = 'http://localhost:3001/api';
const API_KEY = 'test';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  },
});

async function testIntegration() {
  console.log('🚀 Testando Integração Completa - Frontend + Backend + Supabase');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Backend está rodando:', healthResponse.data);
    console.log('');

    // Teste 2: Criar Lead
    console.log('2️⃣ Testando criação de Lead...');
    const testLead = {
      name: 'João Silva Teste',
      email: 'joao.teste@exemplo.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste LTDA',
      source: 'website',
      status: 'lead-bruto',
      priority: 'medium',
      notes: 'Lead criado via teste de integração'
    };

    const leadResponse = await api.post('/leads', testLead);
    const leadId = leadResponse.data.id;
    console.log('✅ Lead criado:', leadId);
    console.log('');

    // Teste 3: Listar Leads
    console.log('3️⃣ Testando listagem de Leads...');
    const leadsResponse = await api.get('/leads');
    console.log(`✅ ${leadsResponse.data.length} leads encontrados`);
    console.log('');

    // Teste 4: Criar Cliente
    console.log('4️⃣ Testando criação de Cliente...');
    const testCustomer = {
      whatsapp_number: '5511999999999',
      name: 'Maria Santos Teste',
      email: 'maria.teste@exemplo.com',
      company: 'Empresa Cliente LTDA',
      tags: ['vip', 'teste'],
      status: 'active',
      notes: 'Cliente criado via teste de integração'
    };

    const customerResponse = await api.post('/customers', testCustomer);
    const customerId = customerResponse.data.id;
    console.log('✅ Cliente criado:', customerId);
    console.log('');

    // Teste 5: Criar Conversa
    console.log('5️⃣ Testando criação de Conversa...');
    const testConversation = {
      customer_id: customerId,
      lead_id: leadId,
      whatsapp_instance: 'test-instance',
      whatsapp_number: '5511999999999',
      status: 'open',
      pipeline_status: 'lead-bruto'
    };

    const conversationResponse = await api.post('/conversations', testConversation);
    const conversationId = conversationResponse.data.id;
    console.log('✅ Conversa criada:', conversationId);
    console.log('');

    // Teste 6: Adicionar Mensagem
    console.log('6️⃣ Testando adição de Mensagem...');
    const testMessage = {
      content: 'Olá! Esta é uma mensagem de teste da integração.',
      sender_type: 'customer',
      message_type: 'text'
    };

    const messageResponse = await api.post(`/conversations/${conversationId}/messages`, testMessage);
    console.log('✅ Mensagem adicionada:', messageResponse.data.id);
    console.log('');

    // Teste 7: Listar Conversas
    console.log('7️⃣ Testando listagem de Conversas...');
    const conversationsResponse = await api.get('/conversations');
    console.log(`✅ ${conversationsResponse.data.length} conversas encontradas`);
    console.log('');

    // Teste 8: Atualizar Status do Pipeline
    console.log('8️⃣ Testando atualização de Status do Pipeline...');
    const updateResponse = await api.put(`/conversations/${conversationId}/pipeline-status`, {
      pipeline_status: 'contato-realizado'
    });
    console.log('✅ Status atualizado para:', updateResponse.data.pipeline_status);
    console.log('');

    // Teste 9: Dashboard Stats
    console.log('9️⃣ Testando Dashboard Stats...');
    const statsResponse = await api.get('/leads/dashboard/stats');
    console.log('✅ Estatísticas do dashboard:', statsResponse.data);
    console.log('');

    // Teste 10: WhatsApp Instances
    console.log('🔟 Testando WhatsApp Instances...');
    try {
      const instancesResponse = await api.get('/whatsapp/instances');
      console.log(`✅ ${instancesResponse.data.length} instâncias encontradas`);
    } catch (error) {
      console.log('⚠️ Instâncias WhatsApp não disponíveis (normal se não configuradas)');
    }
    console.log('');

    // Limpeza - Remover dados de teste
    console.log('🧹 Limpando dados de teste...');
    try {
      await api.delete(`/conversations/${conversationId}`);
      await api.delete(`/customers/${customerId}`);
      await api.delete(`/leads/${leadId}`);
      console.log('✅ Dados de teste removidos');
    } catch (error) {
      console.log('⚠️ Erro ao limpar dados de teste:', error.message);
    }

    console.log('');
    console.log('🎉 Teste de Integração Concluído com Sucesso!');
    console.log('');
    console.log('📋 Resumo:');
    console.log('- ✅ Backend conectado e funcionando');
    console.log('- ✅ Supabase integrado e operacional');
    console.log('- ✅ APIs de Leads funcionando');
    console.log('- ✅ APIs de Conversas funcionando');
    console.log('- ✅ APIs de Clientes funcionando');
    console.log('- ✅ Dashboard Stats funcionando');
    console.log('- ✅ Pipeline de vendas operacional');
    console.log('');
    console.log('🚀 Próximos passos:');
    console.log('1. Iniciar o frontend: cd frontend && npm start');
    console.log('2. Testar a interface do usuário');
    console.log('3. Configurar webhooks do WhatsApp');
    console.log('4. Implementar autenticação');

  } catch (error) {
    console.error('❌ Erro no teste de integração:', error.message);
    
    if (error.response) {
      console.error('📊 Detalhes do erro:');
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    console.log('');
    console.log('🔧 Verifique:');
    console.log('1. Backend está rodando: cd backend && npm run dev');
    console.log('2. Supabase está configurado: npm run test:supabase');
    console.log('3. Variáveis de ambiente estão corretas');
    console.log('4. Porta 3001 está livre');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testIntegration();
}

module.exports = { testIntegration }; 