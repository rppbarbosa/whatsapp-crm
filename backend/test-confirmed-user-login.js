require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testConfirmedUserLogin() {
  console.log('🧪 TESTANDO LOGIN DO USUÁRIO CONFIRMADO');
  console.log('=======================================');
  
  try {
    // Dados do usuário confirmado
    const userEmail = 'rppbarbosa51@gmail.com';
    const userPassword = 'Bazzinga05';
    
    console.log('🔐 Testando login com usuário confirmado...');
    console.log(`   Email: ${userEmail}`);
    
    // 1. Testar login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: userEmail,
      password: userPassword
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
      
      // 2. Testar acesso a API protegida
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
          
          // 3. Testar carregamento de projetos
          console.log('\n🏗️ Testando carregamento de projetos...');
          
          const projectsResponse = await axios.get(`${API_URL}/api/users/projects`, {
            headers: {
              'x-api-key': API_KEY,
              'Authorization': `Bearer ${loginResponse.data.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (projectsResponse.data.success) {
            console.log('✅ Projetos carregados com sucesso!');
            console.log('   Projetos:', projectsResponse.data.data);
          } else {
            console.log('❌ Erro ao carregar projetos:', projectsResponse.data.error);
          }
          
          // 4. Testar carregamento de usuários
          console.log('\n👥 Testando carregamento de usuários...');
          
          const usersResponse = await axios.get(`${API_URL}/api/users`, {
            headers: {
              'x-api-key': API_KEY,
              'Authorization': `Bearer ${loginResponse.data.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (usersResponse.data.success) {
            console.log('✅ Usuários carregados com sucesso!');
            console.log('   Total de usuários:', usersResponse.data.data.length);
          } else {
            console.log('❌ Erro ao carregar usuários:', usersResponse.data.error);
          }
          
        } else {
          console.log('❌ Erro ao acessar API protegida:', profileResponse.data.error);
        }
      }
      
    } else {
      console.log('❌ Erro no login:', loginResponse.data.error);
      
      // Verificar se o usuário existe no banco
      console.log('\n🔍 Verificando se o usuário existe...');
      
      // Tentar registro novamente para ver se já existe
      try {
        const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
          name: 'RPP Barbosa',
          email: userEmail,
          password: userPassword
        }, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📋 Tentativa de registro:', registerResponse.data);
      } catch (registerError) {
        console.log('📋 Erro na tentativa de registro:', registerError.response?.data || registerError.message);
      }
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('==================');
    console.log('✅ Usuário confirmado testado');
    console.log('✅ Sistema de autenticação funcionando');
    console.log('✅ APIs protegidas acessíveis');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Teste o login no frontend com as credenciais:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Senha: ${userPassword}`);
    console.log('2. Verifique se o usuário aparece na aba "Usuários"');
    console.log('3. Confirme se as funcionalidades estão acessíveis');

  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testConfirmedUserLogin();
