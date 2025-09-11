require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testProfileAPI() {
  console.log('🔍 TESTANDO API DE PERFIL');
  console.log('==================================================');
  
  try {
    // Testar endpoint de perfil
    console.log('🚀 GET /api/users/profile');
    const response = await axios.get(`${BASE_URL}/api/users/profile`);
    
    console.log('✅ Status:', response.status);
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testProfileAPI();
