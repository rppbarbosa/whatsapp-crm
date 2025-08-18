require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.js');

async function updateCompanyToCampaign() {
  console.log('🔄 Atualizando campo empresa para campanha...\n');

  try {
    // 1. Verificar dados atuais
    console.log('1️⃣ Verificando dados atuais...');
    const { data: currentData, error: currentError } = await supabaseAdmin
      .from('leads')
      .select('id, name, company')
      .not('company', 'is', null);

    if (currentError) {
      console.log('❌ Erro ao buscar dados atuais:', currentError.message);
      return;
    }

    console.log(`📊 ${currentData.length} leads com dados de empresa encontrados:`);
    currentData.forEach(lead => {
      console.log(`  - ${lead.name}: "${lead.company}"`);
    });

    // 2. Mapeamento de empresas para campanhas
    const companyToCampaignMap = {
      'rvfgegerg': 'Teste',
      'Teste': 'Teste',
      '': 'Não informado'
    };

    // 3. Atualizar cada lead
    console.log('\n2️⃣ Atualizando leads...');
    let updatedCount = 0;

    for (const lead of currentData) {
      const newCampaign = companyToCampaignMap[lead.company] || 'Outro';
      
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({ company: newCampaign })
        .eq('id', lead.id);

      if (updateError) {
        console.log(`❌ Erro ao atualizar lead ${lead.name}:`, updateError.message);
      } else {
        console.log(`✅ ${lead.name}: "${lead.company}" → "${newCampaign}"`);
        updatedCount++;
      }
    }

    // 4. Verificar resultado
    console.log('\n3️⃣ Verificando resultado...');
    const { data: finalData, error: finalError } = await supabaseAdmin
      .from('leads')
      .select('id, name, company')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log(`\n📊 Resultado final (${finalData.length} leads):`);
      finalData.forEach(lead => {
        console.log(`  - ${lead.name}: "${lead.company}"`);
      });
    }

    console.log(`\n🎉 Atualização concluída! ${updatedCount} leads atualizados.`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateCompanyToCampaign();
}

module.exports = { updateCompanyToCampaign }; 