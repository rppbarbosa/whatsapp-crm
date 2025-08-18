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

async function testInstancesPersistence() {
  console.log('🧪 Testando persistência das instâncias...\n');

  try {
    // 1. Listar instâncias (deve incluir instâncias do banco)
    console.log('1️⃣ Listando instâncias (incluindo persistidas)...');
    const instancesResponse = await api.get('/api/whatsapp/instances');
    console.log('✅ Instâncias encontradas:', instancesResponse.data?.length || 0);
    
    if (instancesResponse.data && instancesResponse.data.length > 0) {
      instancesResponse.data.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance.instanceName} - ${inst.instance.status} ${inst.persisted ? '(persistida)' : ''}`);
      });
    } else {
      console.log('   Nenhuma instância encontrada');
    }

    // 2. Criar uma nova instância de teste
    console.log('\n2️⃣ Criando instância de teste...');
    const testInstanceName = `test-${Date.now()}`;
    const createResponse = await api.post('/api/whatsapp/instances', {
      instanceName: testInstanceName
    });
    console.log('✅ Instância criada:', createResponse.data);

    // 3. Verificar se a instância foi persistida
    console.log('\n3️⃣ Verificando se a instância foi persistida...');
    const instancesAfterCreate = await api.get('/api/whatsapp/instances');
    const createdInstance = instancesAfterCreate.data.find(inst => 
      inst.instance.instanceName === testInstanceName
    );
    
    if (createdInstance) {
      console.log('✅ Instância encontrada na lista:', createdInstance.instance.instanceName);
      console.log('   Status:', createdInstance.instance.status);
      console.log('   Persistida:', createdInstance.persisted);
    } else {
      console.log('❌ Instância não encontrada na lista');
    }

    // 4. Tentar conectar a instância (gerar QR code)
    console.log('\n4️⃣ Tentando conectar a instância...');
    try {
      const connectResponse = await api.get(`/api/whatsapp/instances/${testInstanceName}/connect`);
      console.log('✅ QR Code gerado:', connectResponse.data.qrcode ? 'Sim' : 'Não');
    } catch (error) {
      console.log('⚠️ Erro ao gerar QR code:', error.response?.data?.message || error.message);
    }

    // 5. Verificar status após tentativa de conexão
    console.log('\n5️⃣ Verificando status após tentativa de conexão...');
    const instancesAfterConnect = await api.get('/api/whatsapp/instances');
    const connectedInstance = instancesAfterConnect.data.find(inst => 
      inst.instance.instanceName === testInstanceName
    );
    
    if (connectedInstance) {
      console.log('✅ Status atualizado:', connectedInstance.instance.status);
    }

    // 6. Deletar a instância de teste
    console.log('\n6️⃣ Deletando instância de teste...');
    try {
      await api.delete(`/api/whatsapp/instances/${testInstanceName}`);
      console.log('✅ Instância deletada');
    } catch (error) {
      console.log('⚠️ Erro ao deletar instância:', error.response?.data?.message || error.message);
    }

    // 7. Verificar se foi removida do banco
    console.log('\n7️⃣ Verificando se foi removida do banco...');
    const instancesAfterDelete = await api.get('/api/whatsapp/instances');
    const deletedInstance = instancesAfterDelete.data.find(inst => 
      inst.instance.instanceName === testInstanceName
    );
    
    if (!deletedInstance) {
      console.log('✅ Instância removida com sucesso');
    } else {
      console.log('❌ Instância ainda presente na lista');
    }

    console.log('\n✅ Teste de persistência concluído!');

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

testInstancesPersistence(); 