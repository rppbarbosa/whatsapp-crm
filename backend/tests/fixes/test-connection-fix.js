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

async function testConnectionFix() {
  console.log('🧪 Testando correção da conexão de instâncias...\n');

  try {
    // 1. Listar instâncias
    console.log('1️⃣ Listando instâncias...');
    const instancesResponse = await api.get('/api/whatsapp/instances');
    console.log('✅ Instâncias encontradas:', instancesResponse.data?.length || 0);
    
    instancesResponse.data.forEach(instance => {
      console.log(`  - ${instance.instance.instanceName}: ${instance.instance.status}`);
    });

    // 2. Testar conexão da instância 'teste'
    console.log('\n2️⃣ Testando conexão da instância "teste"...');
    try {
      const connectResponse = await api.get('/api/whatsapp/instances/teste/connect');
      console.log('✅ Conexão iniciada:', connectResponse.data);
      
      if (connectResponse.data.qrcode) {
        console.log('📱 QR Code gerado com sucesso!');
      } else if (connectResponse.data.message) {
        console.log('📱 Mensagem:', connectResponse.data.message);
      }
    } catch (error) {
      console.error('❌ Erro ao conectar instância "teste":', error.response?.data || error.message);
    }

    // 3. Aguardar um pouco e verificar novamente
    console.log('\n3️⃣ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Listar instâncias novamente
    console.log('\n4️⃣ Verificando instâncias após conexão...');
    const instancesAfterResponse = await api.get('/api/whatsapp/instances');
    console.log('✅ Instâncias após conexão:', instancesAfterResponse.data?.length || 0);
    
    instancesAfterResponse.data.forEach(instance => {
      console.log(`  - ${instance.instance.instanceName}: ${instance.instance.status}`);
    });

    // 5. Testar health check
    console.log('\n5️⃣ Testando health check...');
    const healthResponse = await api.get('/api/whatsapp/health');
    console.log('✅ Health check:', healthResponse.data);

    console.log('\n🎉 Teste de correção concluído!');

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

// Executar teste
testConnectionFix(); 