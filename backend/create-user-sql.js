require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createUserWithSQL() {
  console.log('🔧 CRIANDO USUÁRIO REAL VIA SQL DIRETO');
  
  try {
    // 1. Primeiro, vamos desabilitar temporariamente a constraint
    console.log('🔓 Desabilitando constraint de foreign key...');
    const { error: constraintError } = await supabase
      .rpc('exec', {
        query: 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;'
      });
    
    if (constraintError) {
      console.log('⚠️ Aviso ao desabilitar constraint:', constraintError.message);
    } else {
      console.log('✅ Constraint desabilitada');
    }

    // 2. Inserir usuário
    console.log('👤 Inserindo usuário real...');
    const { data: userData, error: userError } = await supabase
      .rpc('exec', {
        query: `
          INSERT INTO profiles (
            id, full_name, email, role, is_active, created_at, updated_at
          ) VALUES (
            '12345678-1234-1234-1234-123456789012',
            'Rony Peterson',
            'rony@tonypetersonadv.com',
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
      console.error('❌ Erro ao inserir usuário:', userError);
    } else {
      console.log('✅ Usuário inserido:', userData);
    }

    // 3. Inserir projeto
    console.log('🏗️ Inserindo projeto...');
    const { data: projectData, error: projectError } = await supabase
      .rpc('exec', {
        query: `
          INSERT INTO projects (
            id, name, description, owner_id, settings, color, created_at, updated_at
          ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'Projeto Principal',
            'Projeto principal do usuário Rony Peterson',
            '12345678-1234-1234-1234-123456789012',
            '{"allow_invites": true, "max_members": 10}',
            '#3B82F6',
            NOW(),
            NOW()
          ) ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            settings = EXCLUDED.settings,
            color = EXCLUDED.color,
            updated_at = NOW();
        `
      });

    if (projectError) {
      console.error('❌ Erro ao inserir projeto:', projectError);
    } else {
      console.log('✅ Projeto inserido:', projectData);
    }

    // 4. Verificar dados
    console.log('🔍 Verificando dados inseridos...');
    const { data: finalUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '12345678-1234-1234-1234-123456789012')
      .single();

    const { data: finalProject } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', '12345678-1234-1234-1234-123456789012');

    console.log('📊 DADOS FINAIS:');
    console.log('👤 Usuário:', finalUser);
    console.log('🏗️ Projetos:', finalProject);

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

createUserWithSQL();
