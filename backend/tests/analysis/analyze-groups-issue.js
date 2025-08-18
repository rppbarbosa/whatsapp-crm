// ===== ANÁLISE DO PROBLEMA DOS GRUPOS =====
require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase');

async function analyzeGroupsIssue() {
  try {
    console.log('🔍 Analisando problema dos grupos...\n');
    
    const instanceName = 'test11';
    
    // 1. Verificar grupos no banco
    console.log('1️⃣ Grupos no banco de dados:');
    const { data: groups, error } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('is_group', true)
      .limit(10);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 Total de grupos: ${groups.length}`);
    
    groups.forEach((group, index) => {
      console.log(`   Grupo ${index + 1}:`);
      console.log(`      ID: ${group.id}`);
      console.log(`      Phone: ${group.phone}`);
      console.log(`      Name: ${group.name}`);
      console.log(`      Display Name: ${group.display_name}`);
    });

    // 2. Verificar contatos com @ no phone
    console.log('\n2️⃣ Contatos com @ no phone:');
    const { data: withAt, error: atError } = await supabaseAdmin
      .from('whatsapp_contacts')
      .select('*')
      .eq('instance_name', instanceName)
      .like('phone', '%@%')
      .limit(10);

    if (atError) {
      console.error('❌ Erro:', atError);
      return;
    }

    console.log(`📊 Contatos com @: ${withAt.length}`);
    
    withAt.forEach((contact, index) => {
      console.log(`   Contato ${index + 1}:`);
      console.log(`      ID: ${contact.id}`);
      console.log(`      Phone: ${contact.phone}`);
      console.log(`      Name: ${contact.name}`);
      console.log(`      Is Group: ${contact.is_group}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeGroupsIssue(); 