const { supabase } = require('./src/services/supabase');

async function createRealUser() {
  console.log('👤 CRIANDO USUÁRIO REAL NO BANCO');
  console.log('='.repeat(40));

  try {
    // Dados do usuário real
    const realUserId = '12345678-1234-1234-1234-123456789012';
    const userEmail = 'rony@tonypetersonadv.com';
    
    console.log('➕ Criando perfil de usuário real...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: realUserId,
        full_name: 'Rony Peterson',
        email: userEmail,
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

    console.log('✅ Perfil criado:', {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role
    });

    // Criar projeto para o usuário
    console.log('\n🏗️  Criando projeto para o usuário...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Projeto Principal - Rony',
        description: 'Projeto principal do usuário Rony Peterson',
        owner_id: realUserId,
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

    console.log('✅ Projeto criado:', {
      id: project.id,
      name: project.name,
      owner_id: project.owner_id
    });

    // Atualizar perfil com project_id
    console.log('\n🔗 Associando usuário ao projeto...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        project_id: project.id
      })
      .eq('id', realUserId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao associar usuário ao projeto:', updateError);
      return false;
    }

    console.log('✅ Usuário associado ao projeto:', {
      id: updatedProfile.id,
      project_id: updatedProfile.project_id
    });

    // Criar alguns logs de auditoria de exemplo
    console.log('\n📊 Criando logs de auditoria de exemplo...');
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: realUserId,
          action: 'user_created',
          resource_type: 'user',
          resource_id: realUserId,
          details: { 
            full_name: 'Rony Peterson', 
            email: userEmail,
            role: 'owner'
          },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: new Date().toISOString()
        },
        {
          user_id: realUserId,
          action: 'project_created',
          resource_type: 'project',
          resource_id: project.id,
          details: { 
            name: project.name, 
            description: project.description,
            color: project.color
          },
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (auditError) {
      console.error('❌ Erro ao criar logs de auditoria:', auditError);
    } else {
      console.log('✅ Logs de auditoria criados:', auditLogs.length, 'logs');
    }

    console.log('\n🎉 USUÁRIO REAL CRIADO COM SUCESSO!');
    console.log('📋 Detalhes:');
    console.log(`  👤 ID: ${realUserId}`);
    console.log(`  📧 Email: ${userEmail}`);
    console.log(`  🏗️  Projeto: ${project.name} (${project.id})`);
    console.log(`  📊 Logs: ${auditLogs?.length || 0} logs criados`);
    
    return true;

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createRealUser().catch(console.error);
}

module.exports = { createRealUser };
