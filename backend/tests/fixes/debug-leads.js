require('dotenv').config();
const { supabase, supabaseAdmin } = require('./src/services/supabase.js');

async function debugLeads() {
  console.log('🔍 Debug da tabela leads...\n');

  try {
    // 1. Verificar se há dados na tabela
    console.log('1️⃣ Verificando dados na tabela...');
    const { data: allData, error: allError } = await supabaseAdmin
      .from('leads')
      .select('*');

    if (allError) {
      console.log('❌ Erro ao buscar todos os leads:', allError.message);
      return;
    }

    console.log(`📊 Total de leads na tabela: ${allData.length}`);
    if (allData.length > 0) {
      console.log('📋 Primeiros leads:');
      allData.slice(0, 3).forEach((lead, index) => {
        console.log(`  ${index + 1}. ${lead.name} (${lead.email}) - ${lead.status}`);
      });
    }

    // 2. Testar com supabase (chave anônima)
    console.log('\n2️⃣ Testando com chave anônima...');
    const { data: anonData, error: anonError } = await supabase
      .from('leads')
      .select('*');

    if (anonError) {
      console.log('❌ Erro com chave anônima:', anonError.message);
    } else {
      console.log(`✅ Chave anônima: ${anonData.length} leads encontrados`);
    }

    // 3. Testar com supabaseAdmin (service role)
    console.log('\n3️⃣ Testando com service role...');
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('leads')
      .select('*');

    if (adminError) {
      console.log('❌ Erro com service role:', adminError.message);
    } else {
      console.log(`✅ Service role: ${adminData.length} leads encontrados`);
    }

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('get_policies', { table_name: 'leads' })
      .catch(() => ({ data: null, error: 'Função não disponível' }));

    if (policiesError) {
      console.log('ℹ️  Não foi possível verificar políticas RLS diretamente');
    } else {
      console.log('📋 Políticas RLS encontradas:', policies);
    }

    // 5. Testar inserção e leitura imediata
    console.log('\n5️⃣ Testando inserção e leitura imediata...');
    const testLead = {
      name: 'Debug Test',
      email: 'debug@test.com',
      phone: '(11) 11111-1111',
      company: 'Debug Company',
      source: 'website',
      status: 'lead-bruto',
      priority: 'medium',
      notes: 'Lead para debug'
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir lead de debug:', insertError.message);
    } else {
      console.log('✅ Lead de debug inserido:', insertData.id);

      // Tentar ler imediatamente
      const { data: readData, error: readError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', insertData.id)
        .single();

      if (readError) {
        console.log('❌ Erro ao ler lead recém-inserido:', readError.message);
      } else {
        console.log('✅ Lead recém-inserido lido com sucesso:', readData.name);
      }

      // Limpar lead de debug
      await supabaseAdmin
        .from('leads')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Lead de debug removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  debugLeads();
}

module.exports = { debugLeads }; 