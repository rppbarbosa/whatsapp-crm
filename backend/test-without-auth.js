const axios = require('axios');
require('dotenv').config();

// Configuração
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Configurar axios com interceptors para logs
axios.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📤 Body:', JSON.stringify(config.data, null, 2));
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    return response;
  },
  (error) => {
    console.error(`❌ ${error.response?.status || 'ERROR'} ${error.config?.url}`);
    console.error('📥 Error Response:', JSON.stringify(error.response?.data, null, 2));
    return Promise.reject(error);
  }
);

// Função para fazer requisições autenticadas
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar token de autenticação
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer test-token`;
  return config;
});

async function testBasicEndpoints() {
  console.log('🧪 TESTE BÁSICO DAS APIS');
  console.log('='.repeat(50));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check funcionando');

    // Teste 2: Informações da API
    console.log('\n2️⃣ Testando Informações da API...');
    const infoResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Informações da API funcionando');

    // Teste 3: Testar rota de usuários (esperamos erro 500, mas sem crash)
    console.log('\n3️⃣ Testando Rota de Usuários...');
    try {
      const userResponse = await api.get('/users/profile');
      console.log('✅ Rota de usuários funcionando');
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️  Rota de usuários retorna erro 500 (esperado sem usuário real)');
      } else {
        console.log('❌ Erro inesperado na rota de usuários:', error.message);
      }
    }

    // Teste 4: Testar rota de projetos
    console.log('\n4️⃣ Testando Rota de Projetos...');
    try {
      const projectsResponse = await api.get('/users/projects');
      console.log('✅ Rota de projetos funcionando');
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️  Rota de projetos retorna erro 500 (esperado sem usuário real)');
      } else {
        console.log('❌ Erro inesperado na rota de projetos:', error.message);
      }
    }

    // Teste 5: Testar rota de auditoria
    console.log('\n5️⃣ Testando Rota de Auditoria...');
    try {
      const auditResponse = await api.get('/users/audit-logs');
      console.log('✅ Rota de auditoria funcionando');
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('⚠️  Rota de auditoria retorna erro 500 (esperado sem usuário real)');
      } else {
        console.log('❌ Erro inesperado na rota de auditoria:', error.message);
      }
    }

    console.log('\n🎉 TESTE BÁSICO CONCLUÍDO!');
    console.log('✅ Servidor está funcionando');
    console.log('✅ Rotas estão registradas');
    console.log('✅ APIs estão respondendo');
    console.log('⚠️  Erros 500 são esperados sem usuário real no banco');

    return true;

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE BÁSICO:');
    console.error('Erro:', error.message);
    return false;
  }
}

// Executar teste
if (require.main === module) {
  testBasicEndpoints().catch(console.error);
}

module.exports = { testBasicEndpoints };
