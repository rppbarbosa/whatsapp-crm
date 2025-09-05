const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testCleanImplementation() {
  console.log('🧹 Testando Implementação LIMPA...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health:', healthResponse.data);

    // 2. Status inicial
    console.log('\n2️⃣ Status inicial...');
    const statusResponse = await axios.get(`${API_BASE_URL}/api/whatsapp/status`, {
      headers: { 'apikey': API_KEY }
    });
    console.log('✅ Status:', statusResponse.data);

    // 3. Inicializar
    console.log('\n3️⃣ Inicializando...');
    const initResponse = await axios.post(`${API_BASE_URL}/api/whatsapp/initialize`, {}, {
      headers: { 'apikey': API_KEY }
    });
    console.log('✅ Inicialização:', initResponse.data);

    console.log('\n🎉 IMPLEMENTAÇÃO LIMPA FUNCIONANDO!');

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testCleanImplementation();
