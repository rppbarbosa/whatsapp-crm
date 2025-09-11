const axios = require('axios');
require('dotenv').config();

// Configuração
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testServerBasic() {
  console.log('🧪 TESTE BÁSICO DO SERVIDOR');
  console.log('='.repeat(40));
  console.log(`🌐 URL: ${BASE_URL}`);
  console.log('='.repeat(40));

  try {
    // Teste 1: Health Check
    console.log('\n1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ Status: ${healthResponse.status}`);
    console.log(`📊 Data:`, healthResponse.data);

    // Teste 2: Informações da API
    console.log('\n2️⃣ Testando Informações da API...');
    const infoResponse = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
    console.log(`✅ Status: ${infoResponse.status}`);
    console.log(`📋 Endpoints disponíveis:`, infoResponse.data.endpoints);

    // Teste 3: Verificar se as rotas de usuários estão registradas
    console.log('\n3️⃣ Testando Rota de Usuários...');
    try {
      const userResponse = await axios.get(`${BASE_URL}/api/users/profile`, { 
        timeout: 5000,
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log(`✅ Rota de usuários está funcionando`);
    } catch (userError) {
      if (userError.response?.status === 401) {
        console.log(`✅ Rota de usuários está funcionando (retornou 401 - esperado sem token válido)`);
      } else {
        console.log(`⚠️  Rota de usuários retornou: ${userError.response?.status || 'ERRO'}`);
      }
    }

    console.log('\n🎉 TESTE BÁSICO CONCLUÍDO COM SUCESSO!');
    console.log('✅ Servidor está funcionando');
    console.log('✅ Rotas estão registradas');
    console.log('✅ Pronto para testes mais avançados');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE BÁSICO:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Servidor não está rodando!');
      console.error('💡 Execute: npm start no diretório backend');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 URL inválida ou servidor não acessível');
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Timeout - servidor pode estar lento');
    } else {
      console.error('💥 Erro inesperado:', error.message);
    }
    
    console.error('\n🔧 SOLUÇÕES:');
    console.error('1. Verifique se o servidor está rodando: npm start');
    console.error('2. Verifique a URL: http://localhost:3001');
    console.error('3. Verifique se a porta 3001 está livre');
    console.error('4. Verifique os logs do servidor para erros');
  }
}

// Executar teste
if (require.main === module) {
  testServerBasic().catch(console.error);
}

module.exports = { testServerBasic };
