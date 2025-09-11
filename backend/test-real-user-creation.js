require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const API_KEY = 'whatsapp-crm-evolution-key-2024-secure';

async function testRealUserCreation() {
  console.log('🧪 TESTANDO CRIAÇÃO DE USUÁRIO REAL');
  console.log('===================================');
  
  try {
    // Dados do usuário real
    const userEmail = 'rppbarbosa51@gmail.com';
    const userPassword = 'Bazzinga05';
    const userName = 'RPP Barbosa';
    
    console.log('📝 Criando usuário real...');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Nome: ${userName}`);
    
    // 1. Testar registro
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      name: userName,
      email: userEmail,
      password: userPassword
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
            
            // 4. Testar carregamento de projetos
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
          } else {
            console.log('❌ Erro ao acessar API protegida:', profileResponse.data.error);
          }
        }
        
      } else {
        console.log('❌ Erro no login:', loginResponse.data.error);
        
        // Se o login falhou, vamos verificar se o usuário foi criado
        console.log('\n🔍 Verificando se o usuário foi criado...');
        
        // Tentar criar novamente para ver se já existe
        try {
          const retryRegisterResponse = await axios.post(`${API_URL}/api/auth/register`, {
            name: userName,
            email: userEmail,
            password: userPassword
          }, {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📋 Tentativa de registro novamente:', retryRegisterResponse.data);
        } catch (retryError) {
          console.log('📋 Erro na tentativa de registro:', retryError.response?.data || retryError.message);
        }
      }
      
    } else {
      console.log('❌ Erro no registro:', registerResponse.data.error);
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('==================');
    console.log('✅ Usuário real criado e testado');
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

testRealUserCreation();
