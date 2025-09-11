const { supabase } = require('./src/services/supabase');

async function createTestUser() {
  console.log('👤 CRIANDO USUÁRIO DE TESTE');
  console.log('='.repeat(40));

  try {
    // Criar usuário de teste
    const testUserId = '12345678-1234-1234-1234-123456789012';
    
    console.log('➕ Criando perfil de usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        full_name: 'Usuário Teste',
        email: 'test@example.com',
        phone: '+5511999999999',
        role: 'owner',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      return false;
    }

    console.log('✅ Perfil criado:', profile);

    // Criar projeto de teste
    console.log('\n🏗️  Criando projeto de teste...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Projeto Teste',
        description: 'Projeto criado para testes',
        owner_id: testUserId,
        settings: {
          allowInvites: true,
          maxMembers: 10
        },
        color: '#10B981'
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Erro ao criar projeto:', projectError);
      return false;
    }

    console.log('✅ Projeto criado:', project);

    // Atualizar perfil com project_id
    console.log('\n🔗 Associando usuário ao projeto...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        project_id: project.id
      })
      .eq('id', testUserId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao associar usuário ao projeto:', updateError);
      return false;
    }

    console.log('✅ Usuário associado ao projeto:', updatedProfile);

    console.log('\n🎉 USUÁRIO DE TESTE CRIADO COM SUCESSO!');
    console.log('📋 Detalhes:');
    console.log(`  👤 ID: ${testUserId}`);
    console.log(`  📧 Email: test@example.com`);
    console.log(`  🏗️  Projeto: ${project.name} (${project.id})`);
    
    return true;

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestUser().catch(console.error);
}

module.exports = { createTestUser };
