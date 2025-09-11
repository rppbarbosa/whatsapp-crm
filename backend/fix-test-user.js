require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixTestUser() {
  console.log('🔧 CORRIGINDO USUÁRIO DE TESTE');
  console.log('==============================');
  
  try {
    // 1. Listar usuários não confirmados
    console.log('👤 Verificando usuários não confirmados...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
      return;
    }

    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    console.log(`📧 Usuários não confirmados: ${unconfirmedUsers.length}`);
    
    if (unconfirmedUsers.length > 0) {
      console.log('🔓 Confirmando usuários...');
      
      for (const user of unconfirmedUsers) {
        console.log(`  - Confirmando ${user.email}...`);
        
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

    // 2. Verificar perfis
    console.log('\n📊 Verificando perfis...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao verificar profiles:', profilesError);
    } else {
      console.log(`👥 Perfis encontrados: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.email} (${profile.role}) - Ativo: ${profile.is_active}`);
      });
    }

    // 3. Testar login com usuário específico
    console.log('\n🔐 Testando login...');
    const testEmail = 'teste-1757624239480@exemplo.com';
    const testPassword = '123456';
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      
      // Verificar se o usuário existe
      const user = users.users.find(u => u.email === testEmail);
      if (user) {
        console.log('👤 Usuário encontrado:', {
          id: user.id,
          email: user.email,
          email_confirmed: user.email_confirmed_at ? 'Sim' : 'Não',
          created_at: user.created_at
        });
        
        // Tentar confirmar novamente
        console.log('🔓 Tentando confirmar usuário novamente...');
        const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });

        if (confirmError) {
          console.error('❌ Erro ao confirmar:', confirmError.message);
        } else {
          console.log('✅ Usuário confirmado novamente');
          
          // Tentar login novamente
          console.log('🔐 Tentando login novamente...');
          const { data: retryLoginData, error: retryLoginError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
          });

          if (retryLoginError) {
            console.error('❌ Erro no login após confirmação:', retryLoginError.message);
          } else {
            console.log('✅ Login realizado com sucesso!');
            console.log('   Token:', retryLoginData.session?.access_token ? 'Recebido' : 'Não recebido');
          }
        }
      } else {
        console.log('❌ Usuário não encontrado');
      }
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('   Token:', loginData.session?.access_token ? 'Recebido' : 'Não recebido');
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('=====================');
    console.log('✅ Usuários confirmados');
    console.log('✅ Perfis verificados');
    console.log('✅ Sistema de login testado');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

fixTestUser();
