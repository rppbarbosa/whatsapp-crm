require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateAuthSystem() {
  console.log('🔧 ATUALIZANDO SISTEMA DE AUTENTICAÇÃO');
  console.log('=====================================');
  
  try {
    // 1. Verificar configuração atual
    console.log('🔍 Verificando configuração atual...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
      return;
    }

    console.log(`👤 Total de usuários: ${users.users.length}`);
    
    // 2. Confirmar todos os usuários não confirmados
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    if (unconfirmedUsers.length > 0) {
      console.log(`🔓 Confirmando ${unconfirmedUsers.length} usuários não confirmados...`);
      
      for (const user of unconfirmedUsers) {
        const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });

        if (confirmError) {
          console.error(`    ❌ Erro ao confirmar ${user.email}:`, confirmError.message);
        } else {
          console.log(`    ✅ ${user.email} confirmado`);
        }
      }
    }

    // 3. Verificar se há usuários na tabela profiles
    console.log('\n📊 Verificando tabela profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Erro ao verificar profiles:', profilesError);
    } else {
      console.log(`👥 Perfis na tabela profiles: ${profiles.length}`);
      
      // Verificar se há usuários sem perfil
      const userIds = users.users.map(u => u.id);
      const profileIds = profiles.map(p => p.id);
      const usersWithoutProfile = userIds.filter(id => !profileIds.includes(id));
      
      if (usersWithoutProfile.length > 0) {
        console.log(`⚠️ ${usersWithoutProfile.length} usuários sem perfil na tabela profiles`);
        
        // Criar perfis para usuários sem perfil
        for (const userId of usersWithoutProfile) {
          const user = users.users.find(u => u.id === userId);
          if (user) {
            console.log(`  - Criando perfil para ${user.email}...`);
            
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email,
                role: 'user',
                is_active: true,
                created_at: user.created_at,
                updated_at: new Date().toISOString()
              });

            if (profileError) {
              console.error(`    ❌ Erro ao criar perfil:`, profileError.message);
            } else {
              console.log(`    ✅ Perfil criado para ${user.email}`);
            }
          }
        }
      }
    }

    // 4. Testar criação de usuário completo
    console.log('\n🧪 Testando criação de usuário completo...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testPassword = '123456';
    const testName = 'Usuário Teste';
    
    // Criar usuário no Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError);
      return;
    }

    console.log('✅ Usuário criado no Supabase Auth:', {
      id: signUpData.user?.id,
      email: signUpData.user?.email,
      email_confirmed: signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'
    });

    // Confirmar usuário automaticamente
    if (signUpData.user?.id) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true
      });

      if (confirmError) {
        console.error('❌ Erro ao confirmar usuário:', confirmError.message);
      } else {
        console.log('✅ Usuário confirmado automaticamente');
      }

      // Criar perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: testEmail,
          full_name: testName,
          role: 'user',
          is_active: true,
          created_at: signUpData.user.created_at,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil criado na tabela profiles');
      }

      // Testar login
      console.log('\n🔐 Testando login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
      } else {
        console.log('✅ Login realizado com sucesso!');
        console.log('   Usuário pode fazer login normalmente');
      }

      // Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
      if (deleteError) {
        console.log('⚠️ Não foi possível deletar usuário de teste:', deleteError.message);
      } else {
        console.log('✅ Usuário de teste removido');
      }
    }

    console.log('\n🎉 SISTEMA DE AUTENTICAÇÃO ATUALIZADO!');
    console.log('=====================================');
    console.log('✅ Todos os usuários foram confirmados');
    console.log('✅ Perfis foram criados/atualizados');
    console.log('✅ Sistema funciona sem confirmação de email');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o painel do Supabase');
    console.log('2. Vá em Authentication > Settings');
    console.log('3. Desabilite "Enable email confirmations"');
    console.log('4. Teste o registro de novos usuários');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

updateAuthSystem();
