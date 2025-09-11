require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testUpdateProfile() {
  console.log('🧪 TESTANDO ATUALIZAÇÃO DE PERFIL');
  console.log('=================================');
  
  try {
    // 1. Fazer login primeiro
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'rppbarbosa51@gmail.com',
      password: 'Bazzinga05'
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!loginResponse.data.success) {
      console.error('❌ Erro no login:', loginResponse.data.error);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    const token = loginResponse.data.token;

    // 2. Buscar perfil atual
    console.log('\n👤 Buscando perfil atual...');
    const profileResponse = await axios.get(`${API_URL}/api/users/profile`, {
      headers: {
        'x-api-key': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (profileResponse.data.success) {
      console.log('✅ Perfil atual:', profileResponse.data.data);
    } else {
      console.error('❌ Erro ao buscar perfil:', profileResponse.data.error);
      return;
    }

    // 3. Atualizar perfil
    console.log('\n✏️ Atualizando perfil...');
    const updateData = {
      full_name: 'RPP Barbosa Atualizado',
      phone: '5511999888777'
    };

    const updateResponse = await axios.put(`${API_URL}/api/users/profile`, updateData, {
      headers: {
        'x-api-key': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (updateResponse.data.success) {
      console.log('✅ Perfil atualizado com sucesso!');
      console.log('   Dados atualizados:', updateResponse.data.data);
    } else {
      console.error('❌ Erro ao atualizar perfil:', updateResponse.data.error);
      return;
    }

    // 4. Verificar se a atualização foi persistida
    console.log('\n🔍 Verificando se a atualização foi persistida...');
    const verifyResponse = await axios.get(`${API_URL}/api/users/profile`, {
      headers: {
        'x-api-key': API_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.data.success) {
      console.log('✅ Perfil verificado:', verifyResponse.data.data);
      
      // Verificar se os dados foram realmente atualizados
      const updatedProfile = verifyResponse.data.data;
      if (updatedProfile.full_name === 'RPP Barbosa Atualizado' && updatedProfile.phone === '5511999888777') {
        console.log('🎉 SUCESSO! Os dados foram atualizados corretamente no banco!');
      } else {
        console.log('⚠️ Os dados não foram atualizados corretamente');
        console.log('   Esperado: RPP Barbosa Atualizado, 5511999888777');
        console.log('   Atual:', updatedProfile.full_name, updatedProfile.phone);
      }
    } else {
      console.error('❌ Erro ao verificar perfil:', verifyResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testUpdateProfile();
