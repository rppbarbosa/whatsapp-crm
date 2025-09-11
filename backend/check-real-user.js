require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRealUser() {
  console.log('🔍 VERIFICANDO USUÁRIO REAL NO BANCO');
  const userEmail = 'rony@ronypetersonadv.com';
  
  try {
    // Buscar usuário por email
    console.log(`🔍 Buscando usuário: ${userEmail}`);
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      
      // Se não encontrar por email, buscar todos os usuários
      console.log('🔍 Listando todos os usuários...');
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);
      
      if (allUsersError) {
        console.error('❌ Erro ao listar usuários:', allUsersError);
      } else {
        console.log('📋 Usuários encontrados:', allUsers);
      }
    } else {
      console.log('✅ Usuário encontrado:', user);
      
      // Verificar se tem projetos
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);
      
      if (projectsError) {
        console.error('❌ Erro ao buscar projetos:', projectsError);
      } else {
        console.log('🏗️ Projetos do usuário:', projects);
      }
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkRealUser();
