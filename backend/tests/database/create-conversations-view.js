require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.js');

async function createConversationsView() {
  console.log('🔧 Criando view conversations_with_lead...\n');

  try {
    // SQL para criar a view
    const createViewSQL = `
      CREATE OR REPLACE VIEW conversations_with_lead AS
      SELECT 
        c.id,
        c.customer_id,
        c.lead_id,
        c.whatsapp_instance,
        c.whatsapp_number,
        c.status,
        c.pipeline_status,
        c.last_message_at,
        c.created_at,
        c.updated_at,
        -- Dados do lead
        l.name as lead_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.status as lead_status,
        l.campaign as lead_campaign,
        -- Dados do customer
        cust.name as customer_name,
        cust.whatsapp_number as customer_whatsapp,
        cust.email as customer_email
      FROM conversations c
      LEFT JOIN leads l ON c.lead_id = l.id
      LEFT JOIN customers cust ON c.customer_id = cust.id
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createViewSQL });

    if (error) {
      console.log('❌ Erro ao criar view:', error.message);
      return;
    }

    console.log('✅ View conversations_with_lead criada com sucesso!');

    // Verificar se a view foi criada
    const { data: testData, error: testError } = await supabaseAdmin
      .from('conversations_with_lead')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao testar view:', testError.message);
    } else {
      console.log('✅ View testada com sucesso!');
      console.log('📊 Estrutura da view:', Object.keys(testData[0] || {}));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createConversationsView();
}

module.exports = { createConversationsView }; 