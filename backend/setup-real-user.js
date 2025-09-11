require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupRealUser() {
  console.log('🔧 CONFIGURANDO USUÁRIO REAL NO SISTEMA');
  const userId = '12345678-1234-1234-1234-123456789012';
  const userEmail = 'rony@tonypetersonadv.com';
  const userName = 'Rony Peterson';

  try {
    // 1. Primeiro, vamos verificar se o usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser) {
      console.log('✅ Usuário já existe:', existingUser);
    } else {
      console.log('➕ Usuário não existe, criando...');
      
      // 2. Inserir usuário diretamente usando SQL raw
      const { data: userData, error: userError } = await supabase
        .rpc('exec_sql', {
          sql: `
            INSERT INTO profiles (
              id, full_name, email, role, is_active, created_at, updated_at
            ) VALUES (
              '${userId}',
              '${userName}',
              '${userEmail}',
              'owner',
              true,
              NOW(),
              NOW()
            ) ON CONFLICT (id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              email = EXCLUDED.email,
              role = EXCLUDED.role,
              is_active = EXCLUDED.is_active,
              updated_at = NOW();
          `
        });

      if (userError) {
        console.error('❌ Erro ao criar usuário via RPC:', userError);
        
        // 3. Se RPC não funcionar, tentar inserção direta
        console.log('🔄 Tentando inserção direta...');
        const { data: directUserData, error: directUserError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: userName,
            email: userEmail,
            role: 'owner',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select();

        if (directUserError) {
          console.error('❌ Erro ao criar usuário diretamente:', directUserError);
          
          // 4. Última tentativa: usar upsert
          console.log('🔄 Tentando upsert...');
          const { data: upsertUserData, error: upsertUserError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              full_name: userName,
              email: userEmail,
              role: 'owner',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select();

          if (upsertUserError) {
            console.error('❌ Erro ao fazer upsert do usuário:', upsertUserError);
            return;
          } else {
            console.log('✅ Usuário criado via upsert:', upsertUserData);
          }
        } else {
          console.log('✅ Usuário criado diretamente:', directUserData);
        }
      } else {
        console.log('✅ Usuário criado via RPC:', userData);
      }
    }

    // 5. Criar projeto para o usuário
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
      console.log('✅ Projeto criado com sucesso:', projectData);
    }

    // 6. Verificar dados finais
    console.log('🔍 Verificando dados criados...');
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

    if (finalUser && finalProject) {
      console.log('🎉 SUCESSO! Usuário e projeto criados com sucesso!');
    } else {
      console.log('⚠️ AVISO: Alguns dados podem não ter sido criados corretamente');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

setupRealUser();
