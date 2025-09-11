require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

// Usar service role para acessar configurações administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSupabaseSMTP() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DE SMTP NO SUPABASE');
  console.log('================================================');
  
  try {
    // 1. Verificar usuários não confirmados
    console.log('👤 Verificando usuários não confirmados...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
    } else {
      const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
      console.log(`📧 Usuários não confirmados: ${unconfirmedUsers.length}`);
      
      if (unconfirmedUsers.length > 0) {
        console.log('📋 Detalhes dos usuários não confirmados:');
        unconfirmedUsers.forEach(user => {
          console.log(`  - ${user.email} (criado em: ${user.created_at})`);
          console.log(`    Confirmação enviada: ${user.confirmation_sent_at ? 'Sim' : 'Não'}`);
        });
      }
    }

    // 2. Verificar configuração de autenticação
    console.log('\n🔐 Verificando configuração de autenticação...');
    console.log('ℹ️ Para verificar configuração de SMTP:');
    console.log('   1. Acesse: https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em Authentication > Settings');
    console.log('   4. Verifique a seção "SMTP Settings"');
    console.log('   5. Se não estiver configurado, configure um provedor SMTP');

    // 3. Testar envio de email de confirmação
    console.log('\n📧 Testando envio de email de confirmação...');
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
        email_confirmed: signUpData.user?.email_confirmed_at ? 'Sim' : 'Não',
        confirmation_sent: signUpData.user?.confirmation_sent_at ? 'Sim' : 'Não'
      });
      
      // Aguardar um pouco para ver se o email é enviado
      console.log('⏳ Aguardando 5 segundos para verificar se email foi enviado...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar novamente o status do usuário
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(signUpData.user.id);
      if (userError) {
        console.error('❌ Erro ao verificar usuário:', userError);
      } else {
        console.log('📧 Status após 5 segundos:', {
          email_confirmed: userData.user?.email_confirmed_at ? 'Sim' : 'Não',
          confirmation_sent: userData.user?.confirmation_sent_at ? 'Sim' : 'Não'
        });
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

    // 4. Verificar se há configuração de SMTP
    console.log('\n📧 DIAGNÓSTICO DE EMAIL:');
    console.log('========================');
    console.log('❌ PROBLEMA IDENTIFICADO:');
    console.log('   O Supabase não está configurado para enviar emails de confirmação.');
    console.log('');
    console.log('🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('');
    console.log('1️⃣ CONFIGURAR SMTP NO SUPABASE:');
    console.log('   - Acesse: https://supabase.com/dashboard');
    console.log('   - Selecione seu projeto');
    console.log('   - Vá em Authentication > Settings');
    console.log('   - Configure SMTP Settings com:');
    console.log('     * Gmail, SendGrid, Mailgun, etc.');
    console.log('     * Ou use o provedor padrão (limitado)');
    console.log('');
    console.log('2️⃣ DESABILITAR CONFIRMAÇÃO DE EMAIL:');
    console.log('   - No painel do Supabase');
    console.log('   - Authentication > Settings');
    console.log('   - Desabilite "Enable email confirmations"');
    console.log('   - Isso permitirá login sem confirmação');
    console.log('');
    console.log('3️⃣ USAR AUTENTICAÇÃO SIMPLIFICADA:');
    console.log('   - Modificar o sistema para não depender de confirmação');
    console.log('   - Usar autenticação direta no banco de dados');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkSupabaseSMTP();
