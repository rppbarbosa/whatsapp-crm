require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado. Configure as variáveis no .env');
  process.exit(1);
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testSupabaseLogin() {
  console.log('🧪 TESTANDO LOGIN DIRETO NO SUPABASE');
  console.log('====================================');
  
  try {
    // 1. Criar usuário de teste
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testPassword = '123456';
    const testName = 'Usuário Teste';
    
    console.log('📝 Criando usuário de teste...');
    console.log(`   Email: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError.message);
      return;
    }

    console.log('✅ Usuário criado:', {
      id: signUpData.user?.id,
      email: signUpData.user?.email,
      email_confirmed: signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'
    });

    // 2. Confirmar usuário com admin
    if (signUpData.user?.id) {
      console.log('🔓 Confirmando usuário com admin...');
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true
      });

      if (confirmError) {
        console.error('❌ Erro ao confirmar usuário:', confirmError.message);
      } else {
        console.log('✅ Usuário confirmado');
      }

      // 3. Criar perfil
      console.log('👤 Criando perfil...');
      const { error: profileError } = await supabaseAdmin
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
        console.log('✅ Perfil criado');
      }

      // 4. Testar login com anon key
      console.log('\n🔐 Testando login com anon key...');
      const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
        
        // Verificar status do usuário
        console.log('🔍 Verificando status do usuário...');
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(signUpData.user.id);
        
        if (userError) {
          console.error('❌ Erro ao verificar usuário:', userError.message);
        } else {
          console.log('👤 Status do usuário:', {
            id: userData.user.id,
            email: userData.user.email,
            email_confirmed: userData.user.email_confirmed_at ? 'Sim' : 'Não',
            created_at: userData.user.created_at,
            last_sign_in_at: userData.user.last_sign_in_at
          });
        }
      } else {
        console.log('✅ Login realizado com sucesso!');
        console.log('   Token:', loginData.session?.access_token ? 'Recebido' : 'Não recebido');
        console.log('   Usuário:', loginData.user?.email);
      }

      // 5. Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...');
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      if (deleteError) {
        console.log('⚠️ Não foi possível deletar usuário de teste:', deleteError.message);
      } else {
        console.log('✅ Usuário de teste removido');
      }
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

testSupabaseLogin();
