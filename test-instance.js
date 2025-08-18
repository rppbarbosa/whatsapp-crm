const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/whatsapp';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testInstanceCreation() {
  try {
    console.log('🧪 Testando criação de instância...');
    
    // Primeiro, fazer limpeza completa
    console.log('🧹 Fazendo limpeza completa...');
    await axios.post(`${API_BASE}/cleanup`, {}, {
      headers: { 'apikey': API_KEY }
    });
    console.log('✅ Limpeza concluída');
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Tentar criar uma instância
    console.log('📱 Criando instância de teste...');
    const response = await axios.post(`${API_BASE}/instances`, {
      instanceName: 'teste-novo'
    }, {
      headers: { 'apikey': API_KEY }
    });
    
    console.log('✅ Instância criada com sucesso:', response.data);
    
    // Aguardar um pouco e verificar status
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📊 Verificando status das instâncias...');
    const instancesResponse = await axios.get(`${API_BASE}/instances`, {
      headers: { 'apikey': API_KEY }
    });
    
    console.log('📋 Instâncias:', instancesResponse.data);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('🔍 Detalhes do erro:', error.response.data);
    }
  }
}

// Executar teste
testInstanceCreation(); 