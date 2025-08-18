require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.js');

async function insertTestData() {
  console.log('🌱 Inserindo dados de teste para o Kanban...\n');

  try {
    // Inserir leads de teste
    const testLeads = [
      {
        name: 'João Silva',
        email: 'joao@teste.com',
        phone: '(11) 99999-9999',
        campaign: 'Google Ads',
        source: 'website',
        status: 'lead-bruto',
        priority: 'high',
        notes: 'Lead de teste para drag and drop'
      },
      {
        name: 'Maria Santos',
        email: 'maria@teste.com',
        phone: '(11) 88888-8888',
        campaign: 'Facebook Ads',
        source: 'social',
        status: 'contato-realizado',
        priority: 'medium',
        notes: 'Outro lead de teste'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro@teste.com',
        phone: '(11) 77777-7777',
        campaign: 'LinkedIn Ads',
        source: 'social',
        status: 'qualificado',
        priority: 'high',
        notes: 'Lead qualificado de teste'
      }
    ];

    for (const lead of testLeads) {
      const { data, error } = await supabaseAdmin
        .from('leads')
        .insert(lead)
        .select()
        .single();

      if (error) {
        console.log(`❌ Erro ao inserir lead ${lead.name}:`, error.message);
      } else {
        console.log(`✅ Lead inserido: ${lead.name} (${lead.status})`);
      }
    }

    console.log('\n🎉 Dados de teste inseridos com sucesso!');
    console.log('📊 Agora você pode testar o drag and drop no Kanban.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  insertTestData();
}

module.exports = { insertTestData }; 