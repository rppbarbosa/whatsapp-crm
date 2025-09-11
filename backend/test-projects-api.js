require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testProjectsAPI() {
  console.log('🔍 TESTANDO API DE PROJETOS');
  console.log('==================================================');
  
  try {
    // Testar endpoint de projetos
    console.log('🚀 GET /api/users/projects');
    const response = await axios.get(`${BASE_URL}/api/users/projects`);
    
    console.log('✅ Status:', response.status);
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.projects) {
      console.log('📊 Número de projetos:', response.data.projects.length);
      if (response.data.projects.length > 0) {
        console.log('🏗️ Primeiro projeto:', response.data.projects[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testProjectsAPI();
