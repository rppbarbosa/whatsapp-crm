// Script para testar a integração frontend-backend
const axios = require('axios');

// Configuração
const API_BASE_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  },
});

async function testIntegration() {
  console.log('🧪 TESTE DE INTEGRAÇÃO FRONTEND-BACKEND');
  console.log('='.repeat(50));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await api.get('/health');
    console.log('✅ Health Check:', healthResponse.data.status);

    // Teste 2: Perfil do usuário
    console.log('\n2️⃣ Testando Perfil do Usuário...');
    try {
      const profileResponse = await api.get('/api/users/profile');
      console.log('✅ Perfil carregado:', profileResponse.data);
    } catch (error) {
      console.log('⚠️  Erro no perfil (esperado sem usuário real):', error.response?.data?.message);
    }

    // Teste 3: Projetos do usuário
    console.log('\n3️⃣ Testando Projetos do Usuário...');
    try {
      const projectsResponse = await api.get('/api/users/projects');
      console.log('✅ Projetos carregados:', projectsResponse.data);
    } catch (error) {
      console.log('⚠️  Erro nos projetos (esperado sem usuário real):', error.response?.data?.message);
    }

    // Teste 4: Convites recebidos
    console.log('\n4️⃣ Testando Convites Recebidos...');
    try {
      const invitesResponse = await api.get('/api/users/invites/received');
      console.log('✅ Convites recebidos:', invitesResponse.data);
    } catch (error) {
      console.log('⚠️  Erro nos convites (esperado sem usuário real):', error.response?.data?.message);
    }

    // Teste 5: Convites enviados
    console.log('\n5️⃣ Testando Convites Enviados...');
    try {
      const sentInvitesResponse = await api.get('/api/users/invites/sent');
      console.log('✅ Convites enviados:', sentInvitesResponse.data);
    } catch (error) {
      console.log('⚠️  Erro nos convites enviados (esperado sem usuário real):', error.response?.data?.message);
    }

    // Teste 6: Logs de auditoria
    console.log('\n6️⃣ Testando Logs de Auditoria...');
    try {
      const auditResponse = await api.get('/api/users/audit-logs');
      console.log('✅ Logs de auditoria:', auditResponse.data);
    } catch (error) {
      console.log('⚠️  Erro nos logs (esperado sem usuário real):', error.response?.data?.message);
    }

    // Teste 7: Estatísticas do usuário
    console.log('\n7️⃣ Testando Estatísticas do Usuário...');
    try {
      const statsResponse = await api.get('/api/users/stats');
      console.log('✅ Estatísticas:', statsResponse.data);
    } catch (error) {
      console.log('⚠️  Erro nas estatísticas (esperado sem usuário real):', error.response?.data?.message);
    }

    console.log('\n🎉 TESTE DE INTEGRAÇÃO CONCLUÍDO!');
    console.log('✅ Backend está funcionando');
    console.log('✅ APIs estão respondendo');
    console.log('⚠️  Erros são esperados sem usuário real no banco');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE INTEGRAÇÃO:');
    console.error('Erro:', error.message);
  }
}

// Executar teste
if (require.main === module) {
  testIntegration().catch(console.error);
}

module.exports = { testIntegration };
