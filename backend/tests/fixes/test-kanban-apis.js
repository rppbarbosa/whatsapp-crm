require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.js');

async function testKanbanAPIs() {
  console.log('🧪 Testando APIs do Kanban...\n');

  try {
    // 1. Verificar se há dados nas tabelas
    console.log('1️⃣ Verificando dados nas tabelas...');
    
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .limit(5);

    if (leadsError) {
      console.log('❌ Erro ao buscar leads:', leadsError.message);
    } else {
      console.log(`✅ ${leads.length} leads encontrados`);
      leads.forEach(lead => {
        console.log(`  - ${lead.name} (${lead.status})`);
      });
    }

    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .limit(5);

    if (conversationsError) {
      console.log('❌ Erro ao buscar conversas:', conversationsError.message);
    } else {
      console.log(`✅ ${conversations.length} conversas encontradas`);
      conversations.forEach(conv => {
        console.log(`  - ${conv.whatsapp_number} (${conv.pipeline_status})`);
      });
    }

    // 2. Testar view conversations_with_lead
    console.log('\n2️⃣ Testando view conversations_with_lead...');
    
    const { data: viewData, error: viewError } = await supabaseAdmin
      .from('conversations_with_lead')
      .select('*')
      .limit(3);

    if (viewError) {
      console.log('❌ Erro ao acessar view:', viewError.message);
    } else {
      console.log(`✅ View funcionando: ${viewData.length} registros`);
      viewData.forEach(item => {
        console.log(`  - ${item.lead_name || item.customer_name || 'Sem nome'} (${item.pipeline_status})`);
      });
    }

    // 3. Testar atualização de status de lead
    console.log('\n3️⃣ Testando atualização de status de lead...');
    
    if (leads && leads.length > 0) {
      const testLead = leads[0];
      const newStatus = testLead.status === 'lead-bruto' ? 'contato-realizado' : 'lead-bruto';
      
      const { data: updatedLead, error: updateError } = await supabaseAdmin
        .from('leads')
        .update({ status: newStatus })
        .eq('id', testLead.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Erro ao atualizar lead:', updateError.message);
      } else {
        console.log(`✅ Lead atualizado: ${updatedLead.name} (${updatedLead.status})`);
        
        // Reverter para o status original
        await supabaseAdmin
          .from('leads')
          .update({ status: testLead.status })
          .eq('id', testLead.id);
        console.log('🔄 Status revertido para o original');
      }
    }

    // 4. Testar atualização de status de conversa
    console.log('\n4️⃣ Testando atualização de status de conversa...');
    
    if (conversations && conversations.length > 0) {
      const testConversation = conversations[0];
      const newStatus = testConversation.pipeline_status === 'lead-bruto' ? 'contato-realizado' : 'lead-bruto';
      
      const { data: updatedConversation, error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({ pipeline_status: newStatus })
        .eq('id', testConversation.id)
        .select()
        .single();

      if (updateError) {
        console.log('❌ Erro ao atualizar conversa:', updateError.message);
      } else {
        console.log(`✅ Conversa atualizada: ${updatedConversation.whatsapp_number} (${updatedConversation.pipeline_status})`);
        
        // Reverter para o status original
        await supabaseAdmin
          .from('conversations')
          .update({ pipeline_status: testConversation.pipeline_status })
          .eq('id', testConversation.id);
        console.log('🔄 Status revertido para o original');
      }
    }

    console.log('\n🎉 Testes das APIs do Kanban concluídos!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testKanbanAPIs();
}

module.exports = { testKanbanAPIs }; 