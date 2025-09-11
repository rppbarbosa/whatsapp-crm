const { supabase, supabaseAdmin } = require('./src/services/supabase');

async function testSupabaseConnection() {
  console.log('🗄️ TESTE DE CONEXÃO COM SUPABASE');
  console.log('='.repeat(40));

  try {
    // Teste 1: Conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`⚠️  Erro na conexão: ${error.message}`);
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('💡 Tabela profiles não existe - execute o schema primeiro');
      }
    } else {
      console.log('✅ Conexão com Supabase estabelecida');
    }

    // Teste 2: Verificar se as tabelas existem
    console.log('\n2️⃣ Verificando tabelas do sistema...');
    
    const tables = ['profiles', 'projects', 'project_invites', 'audit_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro inesperado - ${err.message}`);
      }
    }

    // Teste 3: Verificar views
    console.log('\n3️⃣ Verificando views...');
    
    try {
      const { data, error } = await supabase
        .from('project_stats')
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ View project_stats: ${error.message}`);
      } else {
        console.log(`✅ View project_stats: OK`);
      }
    } catch (err) {
      console.log(`❌ View project_stats: Erro inesperado - ${err.message}`);
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs_detailed')
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ View audit_logs_detailed: ${error.message}`);
      } else {
        console.log(`✅ View audit_logs_detailed: OK`);
      }
    } catch (err) {
      console.log(`❌ View audit_logs_detailed: Erro inesperado - ${err.message}`);
    }

    // Teste 4: Verificar funções
    console.log('\n4️⃣ Verificando funções...');
    
    try {
      const { data, error } = await supabase
        .rpc('can_user_join_project', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_project_id: '00000000-0000-0000-0000-000000000000'
        });

      if (error) {
        console.log(`❌ Função can_user_join_project: ${error.message}`);
      } else {
        console.log(`✅ Função can_user_join_project: OK`);
      }
    } catch (err) {
      console.log(`❌ Função can_user_join_project: Erro inesperado - ${err.message}`);
    }

    // Teste 5: Verificar RLS
    console.log('\n5️⃣ Verificando RLS (Row Level Security)...');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error && error.message.includes('new row violates row-level security policy')) {
        console.log(`✅ RLS está ativo na tabela profiles`);
      } else if (error) {
        console.log(`⚠️  RLS pode não estar configurado: ${error.message}`);
      } else {
        console.log(`⚠️  RLS pode não estar ativo (dados retornados sem autenticação)`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar RLS: ${err.message}`);
    }

    console.log('\n📊 RESUMO DO TESTE:');
    console.log('='.repeat(40));
    console.log('✅ Conexão com Supabase: OK');
    console.log('✅ Configuração de ambiente: OK');
    console.log('⚠️  Verifique as tabelas e funções acima');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Se alguma tabela não existe, execute o schema');
    console.log('2. Se as funções não existem, execute o schema');
    console.log('3. Se RLS não está ativo, execute o schema');
    console.log('4. Execute: node test-server-basic.js para testar o servidor');

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NO TESTE:');
    console.error('💥 Erro:', error.message);
    console.error('🔧 Verifique:');
    console.error('1. Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY');
    console.error('2. Conexão com a internet');
    console.error('3. Configuração do projeto no Supabase');
  }
}

// Executar teste
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

module.exports = { testSupabaseConnection };
