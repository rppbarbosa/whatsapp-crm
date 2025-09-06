const { supabaseAdmin } = require('../src/services/supabase');

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', 'teste@exemplo.com')
      .single();

    if (existingUser) {
      console.log('✅ Usuário de teste já existe!');
      console.log('📧 Email: teste@exemplo.com');
      console.log('🔑 Senha: 123456');
      return;
    }

    // Criar usuário de teste
    const { data: newUser, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        email: 'teste@exemplo.com',
        full_name: 'Usuário Teste',
        role: 'user'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário de teste:', error);
      return;
    }

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('📧 Email: teste@exemplo.com');
    console.log('🔑 Senha: 123456');
    console.log('🆔 ID:', newUser.id);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();
