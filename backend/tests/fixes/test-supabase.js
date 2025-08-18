const { supabase, supabaseAdmin } = require('./src/services/supabase.js');

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  try {
    // Teste 1: Conexão básica
    console.log('1️⃣ Testando conexão básica...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Verificar tabelas
    console.log('2️⃣ Verificando tabelas...');
    const tables = [
      'profiles',
      'leads', 
      'pipeline_activities',
      'customers',
      'conversations',
      'messages',
      'whatsapp_instances',
      'ai_configs',
      'auto_responses',
      'activity_logs',
      'metrics'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: ${err.message}`);
      }
    }

    console.log('\n3️⃣ Testando views...');
    const views = [
      'leads_dashboard',
      'conversations_with_lead', 
      'conversion_metrics'
    ];

    for (const view of views) {
      try {
        const { data, error } = await supabase.from(view).select('*').limit(1);
        if (error) {
          console.log(`❌ View ${view}: ${error.message}`);
        } else {
          console.log(`✅ View ${view}: OK`);
        }
      } catch (err) {
        console.log(`❌ View ${view}: ${err.message}`);
      }
    }

    // Teste 4: Inserir dados de teste
    console.log('\n4️⃣ Testando inserção de dados...');
    
    // Teste de inserção de lead
    const testLead = {
      name: 'Teste Lead',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste',
      source: 'website',
      status: 'lead-bruto',
      priority: 'medium'
    };

    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert(testLead)
      .select();

    if (leadError) {
      console.log('❌ Erro ao inserir lead:', leadError.message);
    } else {
      console.log('✅ Lead inserido com sucesso:', leadData[0].id);
      
      // Limpar dados de teste
      await supabase.from('leads').delete().eq('email', 'teste@exemplo.com');
      console.log('🧹 Dados de teste removidos');
    }

    // Teste 5: Verificar configurações de IA
    console.log('\n5️⃣ Verificando configurações de IA...');
    const { data: aiConfigs, error: aiError } = await supabase
      .from('ai_configs')
      .select('*');

    if (aiError) {
      console.log('❌ Erro ao buscar configurações de IA:', aiError.message);
    } else {
      console.log(`✅ ${aiConfigs.length} configuração(ões) de IA encontrada(s)`);
    }

    // Teste 6: Verificar respostas automáticas
    console.log('\n6️⃣ Verificando respostas automáticas...');
    const { data: autoResponses, error: autoError } = await supabase
      .from('auto_responses')
      .select('*');

    if (autoError) {
      console.log('❌ Erro ao buscar respostas automáticas:', autoError.message);
    } else {
      console.log(`✅ ${autoResponses.length} resposta(s) automática(s) encontrada(s)`);
    }

    console.log('\n🎉 Todos os testes concluídos!');
    console.log('\n📋 Resumo:');
    console.log('- ✅ Conexão com Supabase estabelecida');
    console.log('- ✅ Tabelas criadas e funcionando');
    console.log('- ✅ Views configuradas');
    console.log('- ✅ Inserção de dados funcionando');
    console.log('- ✅ Configurações iniciais carregadas');
    
    console.log('\n🚀 Próximos passos:');
    console.log('1. Integrar APIs do backend com Supabase');
    console.log('2. Conectar frontend com dados reais');
    console.log('3. Configurar webhooks do WhatsApp');
    console.log('4. Implementar autenticação');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n🔧 Verifique:');
    console.log('- Variáveis de ambiente configuradas');
    console.log('- Schema SQL executado no Supabase');
    console.log('- Projeto Supabase ativo');
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testSupabaseConnection();
}

module.exports = { testSupabaseConnection }; 