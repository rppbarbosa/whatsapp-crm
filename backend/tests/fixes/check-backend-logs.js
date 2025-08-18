require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'whatsapp-crm-evolution-key-2024-secure',
  },
});

async function checkBackendLogs() {
  console.log('🔍 Verificando logs do backend...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Health check...');
    const health = await api.get('/api/whatsapp/health');
    console.log('✅ Backend OK:', health.data.status);

    // 2. Listar instâncias
    console.log('\n2️⃣ Listando instâncias...');
    const instances = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias:', instances.data.length);
    instances.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status} (persistida: ${inst.persisted})`);
    });

    // 3. Testar deleção com logs detalhados
    console.log('\n3️⃣ Testando deleção com logs detalhados...');
    console.log('   (Verifique o terminal do backend para ver os logs)');
    
    try {
      const deleteResponse = await api.delete('/api/whatsapp/instances/teste');
      console.log('✅ Deleção bem-sucedida:', deleteResponse.data);
    } catch (error) {
      console.error('❌ Erro na deleção:');
      console.error('   Status:', error.response?.status);
      console.error('   Mensagem:', error.response?.data?.message);
      console.error('   Erro:', error.response?.data?.error);
      
      // Verificar se é o erro esperado
      if (error.response?.data?.message === 'Instance not found in database') {
        console.log('✅ Erro esperado: Instância não encontrada no banco');
      } else if (error.response?.data?.message === 'Instance not found') {
        console.log('❌ Erro inesperado: Instância não encontrada no serviço');
        console.log('   Isso indica que a correção não foi aplicada corretamente');
      }
    }

    // 4. Verificar após tentativa
    console.log('\n4️⃣ Verificando após tentativa...');
    const instancesAfter = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias após:', instancesAfter.data.length);
    instancesAfter.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

checkBackendLogs(); 