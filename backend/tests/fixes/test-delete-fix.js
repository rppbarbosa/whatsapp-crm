require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'whatsapp-crm-evolution-key-2024-secure',
  },
});

async function testDeleteFix() {
  console.log('🧪 Testando correção da deleção...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Health check...');
    const health = await api.get('/api/whatsapp/health');
    console.log('✅ Backend OK:', health.data.status);

    // 2. Listar instâncias antes
    console.log('\n2️⃣ Listando instâncias antes da deleção...');
    const instancesBefore = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias antes:', instancesBefore.data.length);
    instancesBefore.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

    // 3. Deletar instância teste
    console.log('\n3️⃣ Deletando instância "teste"...');
    try {
      const deleteResponse = await api.delete('/api/whatsapp/instances/teste');
      console.log('✅ Deleção:', deleteResponse.data);
    } catch (error) {
      console.error('❌ Erro na deleção:', error.response?.data || error.message);
    }

    // 4. Verificar após deleção
    console.log('\n4️⃣ Verificando após deleção...');
    const instancesAfter = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias após:', instancesAfter.data.length);
    instancesAfter.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

    // 5. Testar deleção de instância inexistente
    console.log('\n5️⃣ Testando deleção de instância inexistente...');
    try {
      await api.delete('/api/whatsapp/instances/inexistente');
    } catch (error) {
      console.log('✅ Erro esperado para instância inexistente:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testDeleteFix(); 