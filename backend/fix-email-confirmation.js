require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixEmailConfirmation() {
  console.log('🔧 CORRIGINDO PROBLEMA DE CONFIRMAÇÃO DE EMAIL');
  console.log('==============================================');
  
  try {
    // 1. Listar usuários não confirmados
    console.log('👤 Verificando usuários não confirmados...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
      return;
    }

    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    console.log(`📧 Encontrados ${unconfirmedUsers.length} usuários não confirmados`);

    if (unconfirmedUsers.length > 0) {
      console.log('\n🔓 Confirmando usuários automaticamente...');
      
      for (const user of unconfirmedUsers) {
        console.log(`  - Confirmando ${user.email}...`);
        
        // Confirmar email do usuário
        const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });

        if (confirmError) {
          console.error(`    ❌ Erro ao confirmar ${user.email}:`, confirmError.message);
        } else {
          console.log(`    ✅ ${user.email} confirmado com sucesso`);
        }
      }
    }

    // 2. Verificar se há usuários não confirmados restantes
    console.log('\n🔍 Verificando usuários restantes...');
    const { data: updatedUsers, error: updatedUsersError } = await supabase.auth.admin.listUsers();
    
    if (updatedUsersError) {
      console.error('❌ Erro ao verificar usuários atualizados:', updatedUsersError);
    } else {
      const stillUnconfirmed = updatedUsers.users.filter(user => !user.email_confirmed_at);
      console.log(`📧 Usuários ainda não confirmados: ${stillUnconfirmed.length}`);
      
      if (stillUnconfirmed.length === 0) {
        console.log('🎉 Todos os usuários foram confirmados!');
      }
    }

    // 3. Testar criação de novo usuário
    console.log('\n🧪 Testando criação de novo usuário...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: '123456',
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
        email_confirmed: signUpData.user?.email_confirmed_at ? 'Sim' : 'Não'
      });
      
      // Confirmar automaticamente o usuário de teste
      if (signUpData.user?.id) {
        console.log('🔓 Confirmando usuário de teste automaticamente...');
        const { error: confirmError } = await supabase.auth.admin.updateUserById(signUpData.user.id, {
          email_confirm: true
        });

        if (confirmError) {
          console.error('❌ Erro ao confirmar usuário de teste:', confirmError.message);
        } else {
          console.log('✅ Usuário de teste confirmado automaticamente');
        }
        
        // Limpar usuário de teste
        console.log('🧹 Limpando usuário de teste...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(signUpData.user.id);
        if (deleteError) {
          console.log('⚠️ Não foi possível deletar usuário de teste:', deleteError.message);
        } else {
          console.log('✅ Usuário de teste removido');
        }
      }
    }

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('===================');
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
    console.log('2. Vá em Authentication > Settings');
    console.log('3. Desabilite "Enable email confirmations"');
    console.log('4. Isso evitará o problema no futuro');
    console.log('');
    console.log('✅ PROBLEMA RESOLVIDO!');
    console.log('   Agora os usuários podem fazer login sem confirmação de email.');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

fixEmailConfirmation();
