require('dotenv').config();
const { supabase, supabaseAdmin } = require('./src/services/supabase.js');

async function testLeadsAPI() {
  console.log('🧪 Testando API de Leads...\n');

  try {
    // 1. Testar conexão com Supabase
    console.log('1️⃣ Testando conexão com Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro na conexão com Supabase:', testError.message);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // 2. Testar inserção de lead
    console.log('2️⃣ Testando inserção de lead...');
    const testLead = {
      name: 'Teste API',
      email: 'teste@api.com',
      phone: '(11) 99999-9999',
      company: 'Empresa Teste',
      source: 'website',
      status: 'lead-bruto',
      priority: 'medium',
      notes: 'Lead de teste da API'
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir lead:', insertError.message);
      return;
    }
    console.log('✅ Lead inserido com sucesso:', insertData.id);

    // 3. Testar busca do lead inserido
    console.log('\n3️⃣ Testando busca do lead...');
    const { data: searchData, error: searchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', insertData.id)
      .single();

    if (searchError) {
      console.log('❌ Erro ao buscar lead:', searchError.message);
    } else {
      console.log('✅ Lead encontrado:', searchData.name);
    }

    // 4. Testar listagem de leads
    console.log('\n4️⃣ Testando listagem de leads...');
    const { data: listData, error: listError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (listError) {
      console.log('❌ Erro ao listar leads:', listError.message);
    } else {
      console.log(`✅ ${listData.length} leads encontrados`);
    }

    // 5. Limpar lead de teste
    console.log('\n5️⃣ Limpando lead de teste...');
    const { error: deleteError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.log('❌ Erro ao deletar lead de teste:', deleteError.message);
    } else {
      console.log('✅ Lead de teste removido');
    }

    console.log('\n🎉 Todos os testes passaram! A API de leads está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testLeadsAPI();
}

module.exports = { testLeadsAPI }; 