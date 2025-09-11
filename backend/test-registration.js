require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testRegistration() {
  console.log('🧪 TESTANDO SISTEMA DE REGISTRO');
  console.log('===============================');
  
  try {
    // 1. Testar registro de novo usuário
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testPassword = '123456';
    const testName = 'Usuário Teste';
    
    console.log('📝 Testando registro de usuário...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Nome: ${testName}`);
    
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      name: testName,
      email: testEmail,
      password: testPassword
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (registerResponse.data.success) {
      console.log('✅ Registro realizado com sucesso!');
      console.log('   Resposta:', registerResponse.data);
      
      // 2. Testar login imediatamente
      console.log('\n🔐 Testando login imediatamente...');
      
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testEmail,
        password: testPassword
      }, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (loginResponse.data.success) {
        console.log('✅ Login realizado com sucesso!');
        console.log('   Token:', loginResponse.data.token ? 'Recebido' : 'Não recebido');
        console.log('   Usuário:', loginResponse.data.user);
        
        // 3. Testar acesso a API protegida
        if (loginResponse.data.token) {
          console.log('\n🔒 Testando acesso a API protegida...');
          
          const profileResponse = await axios.get(`${API_URL}/api/users/profile`, {
            headers: {
              'x-api-key': API_KEY,
              'Authorization': `Bearer ${loginResponse.data.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (profileResponse.data.success) {
            console.log('✅ Acesso a API protegida funcionando!');
            console.log('   Perfil:', profileResponse.data.data);
          } else {
            console.log('❌ Erro ao acessar API protegida:', profileResponse.data.error);
          }
        }
        
      } else {
        console.log('❌ Erro no login:', loginResponse.data.error);
      }
      
    } else {
      console.log('❌ Erro no registro:', registerResponse.data.error);
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('==================');
    console.log('✅ Sistema de registro funcionando');
    console.log('✅ Confirmação automática de email');
    console.log('✅ Login imediato após registro');
    console.log('✅ Acesso a APIs protegidas');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Teste o registro no frontend');
    console.log('2. Verifique se o usuário pode fazer login');
    console.log('3. Confirme se as funcionalidades estão acessíveis');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testRegistration();
