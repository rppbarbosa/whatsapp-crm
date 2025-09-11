require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupRealUserData() {
  console.log('🔧 CONFIGURANDO DADOS DO USUÁRIO REAL');
  const userId = 'd1059681-d231-446c-8845-47bd38b86266';
  const userEmail = 'rony@ronypetersonadv.com';
  
  try {
    // 1. Atualizar role do usuário para 'owner'
    console.log('👤 Atualizando role do usuário para owner...');
    const { data: userUpdate, error: userError } = await supabase
      .from('profiles')
      .update({
        role: 'owner',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (userError) {
      console.error('❌ Erro ao atualizar usuário:', userError);
    } else {
      console.log('✅ Usuário atualizado:', userUpdate);
    }

    // 2. Criar projeto para o usuário
    console.log('🏗️ Criando projeto para o usuário...');
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: projectId,
        name: 'Projeto Principal',
        description: 'Projeto principal do usuário Rony Peterson',
        owner_id: userId,
        settings: {
          allow_invites: true,
          max_members: 10
        },
        color: '#3B82F6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select();

    if (projectError) {
      console.error('❌ Erro ao criar projeto:', projectError);
    } else {
      console.log('✅ Projeto criado:', projectData);
    }

    // 3. Atualizar project_id do usuário
    console.log('🔗 Vinculando usuário ao projeto...');
    const { data: userProjectUpdate, error: userProjectError } = await supabase
      .from('profiles')
      .update({
        project_id: projectId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (userProjectError) {
      console.error('❌ Erro ao vincular usuário ao projeto:', userProjectError);
    } else {
      console.log('✅ Usuário vinculado ao projeto:', userProjectUpdate);
    }

    // 4. Verificar dados finais
    console.log('🔍 Verificando dados finais...');
    const { data: finalUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: finalProject } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', userId);

    console.log('📊 DADOS FINAIS:');
    console.log('👤 Usuário:', finalUser);
    console.log('🏗️ Projetos:', finalProject);

    if (finalUser && finalProject && finalProject.length > 0) {
      console.log('🎉 SUCESSO! Usuário e projeto configurados com sucesso!');
      console.log('🔑 ID do usuário para usar no middleware:', userId);
    } else {
      console.log('⚠️ AVISO: Alguns dados podem não ter sido configurados corretamente');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

setupRealUserData();
