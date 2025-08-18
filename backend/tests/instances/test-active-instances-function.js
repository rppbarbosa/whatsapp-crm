// ===== TESTAR FUNÇÃO GET_ACTIVE_INSTANCES =====

require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');

async function testActiveInstancesFunction() {
  try {
    console.log('🧪 Testando função get_active_instances...\n');
    
    // 1. Testar função diretamente
    console.log('1️⃣ Testando função get_active_instances():');
    const { data: activeInstances, error } = await supabaseAdmin
      .rpc('get_active_instances');
    
    if (error) {
      console.error('❌ Erro ao chamar função:', error);
      return;
    }
    
    console.log(`📊 ${activeInstances.length} instâncias ativas retornadas pela função`);
    
    if (activeInstances.length === 0) {
      console.log('   ⚠️ Nenhuma instância ativa encontrada');
    } else {
      activeInstances.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}: ${inst.status}`);
      });
    }
    
    // 2. Comparar com consulta direta
    console.log('\n2️⃣ Comparando com consulta direta:');
    const { data: directQuery, error: directError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (directError) {
      console.error('❌ Erro na consulta direta:', directError);
      return;
    }
    
    console.log(`📊 ${directQuery.length} instâncias encontradas na consulta direta`);
    
    if (directQuery.length === 0) {
      console.log('   ⚠️ Nenhuma instância na tabela');
    } else {
      directQuery.forEach((inst, index) => {
        console.log(`   ${index + 1}. ${inst.instance_name}: ${inst.status}`);
      });
    }
    
    // 3. Verificar diferenças
    console.log('\n3️⃣ Análise das diferenças:');
    const activeInstanceNames = activeInstances.map(inst => inst.instance_name);
    const allInstanceNames = directQuery.map(inst => inst.instance_name);
    
    console.log('Instâncias ativas (função):', activeInstanceNames);
    console.log('Todas as instâncias (tabela):', allInstanceNames);
    
    const missingFromActive = allInstanceNames.filter(name => !activeInstanceNames.includes(name));
    const extraInActive = activeInstanceNames.filter(name => !allInstanceNames.includes(name));
    
    if (missingFromActive.length > 0) {
      console.log('❌ Instâncias faltando na função:', missingFromActive);
    }
    
    if (extraInActive.length > 0) {
      console.log('⚠️ Instâncias extras na função:', extraInActive);
    }
    
    if (missingFromActive.length === 0 && extraInActive.length === 0) {
      console.log('✅ Função e tabela estão sincronizadas');
    }
    
    // 4. Verificar critérios da função
    console.log('\n4️⃣ Verificando critérios da função:');
    const { data: connectedInstances } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('instance_name, status')
      .in('status', ['connected', 'connecting']);
    
    console.log(`📊 ${connectedInstances.length} instâncias com status 'connected' ou 'connecting':`);
    connectedInstances.forEach(inst => {
      console.log(`   - ${inst.instance_name}: ${inst.status}`);
    });
    
    // 5. Sugestões
    console.log('\n5️⃣ Sugestões:');
    if (activeInstances.length === 0 && directQuery.length > 0) {
      console.log('   🔧 A função não está retornando instâncias que deveriam estar ativas');
      console.log('   📝 Verifique a lógica da função get_active_instances');
    } else if (activeInstances.length > 0) {
      console.log('   ✅ Função funcionando corretamente');
      console.log('   📱 Instâncias disponíveis para restauração');
    } else {
      console.log('   📝 Crie novas instâncias via frontend');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testActiveInstancesFunction(); 