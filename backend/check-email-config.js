require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEmailConfig() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DE EMAIL NO SUPABASE');
  console.log('==================================================');
  
  try {
    // 1. Verificar se há usuários não confirmados
    console.log('👤 Verificando usuários não confirmados...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email_confirmed_at', null)
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao verificar usuários:', usersError);
    } else {
      console.log('📧 Usuários não confirmados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('📋 Detalhes dos usuários não confirmados:');
        users.forEach(user => {
          console.log(`  - ${user.email} (criado em: ${user.created_at})`);
        });
      }
    }

    // 2. Verificar configuração de autenticação
    console.log('\n🔐 Verificando configuração de autenticação...');
    const { data: authConfig, error: authError } = await supabase
      .rpc('get_auth_config');

    if (authError) {
      console.log('⚠️ Não foi possível verificar configuração de auth:', authError.message);
    } else {
      console.log('✅ Configuração de auth:', authConfig);
    }

    // 3. Testar criação de usuário
    console.log('\n🧪 Testando criação de usuário...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testPassword = '123456';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário de teste:', signUpError);
    } else {
      console.log('✅ Usuário de teste criado:', {
        id: signUpData.user?.id,
        email: signUpData.user?.email,
        email_confirmed: signUpData.user?.email_confirmed_at ? 'Sim' : 'Não',
        confirmation_sent: signUpData.user?.confirmation_sent_at ? 'Sim' : 'Não'
      });
      
      // Limpar usuário de teste
      if (signUpData.user?.id) {
        console.log('🧹 Limpando usuário de teste...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
        if (deleteError) {
          console.log('⚠️ Não foi possível deletar usuário de teste:', deleteError.message);
        } else {
          console.log('✅ Usuário de teste removido');
        }
      }
    }

    // 4. Verificar se há configuração de SMTP
    console.log('\n📧 Verificando configuração de SMTP...');
    console.log('ℹ️ Para configurar SMTP no Supabase:');
    console.log('   1. Acesse o painel do Supabase');
    console.log('   2. Vá em Authentication > Settings');
    console.log('   3. Configure SMTP Settings');
    console.log('   4. Ou use o provedor padrão (limitado)');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkEmailConfig();
