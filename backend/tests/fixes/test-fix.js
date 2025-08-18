require('dotenv').config();
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'whatsapp-crm-evolution-key-2024-secure',
  },
});

async function testFix() {
  console.log('🧪 Testando correção...\n');

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
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

    // 3. Conectar instância teste
    console.log('\n3️⃣ Conectando instância "teste"...');
    const connect = await api.get('/api/whatsapp/instances/teste/connect');
    console.log('✅ Conexão:', connect.data);

    // 4. Verificar novamente
    console.log('\n4️⃣ Verificando após conexão...');
    const instancesAfter = await api.get('/api/whatsapp/instances');
    console.log('📊 Instâncias após:', instancesAfter.data.length);
    instancesAfter.data.forEach(inst => {
      console.log(`   - ${inst.instance.instanceName}: ${inst.instance.status}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testFix(); 