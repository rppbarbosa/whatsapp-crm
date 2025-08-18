const { supabase } = require('./src/services/supabase.js');

async function seedDashboardData() {
  console.log('🌱 Inserindo dados de exemplo para o Dashboard...');
  
  try {
    // 1. Inserir leads de exemplo
    console.log('📝 Inserindo leads de exemplo...');
    const leadsData = [
      {
        name: 'João Silva',
        email: 'joao.silva@exemplo.com',
        phone: '(11) 99999-1111',
        company: 'Empresa ABC LTDA',
        source: 'website',
        status: 'lead-bruto',
        priority: 'medium',
        notes: 'Interessado em soluções de CRM'
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@exemplo.com',
        phone: '(11) 99999-2222',
        company: 'Tech Solutions',
        source: 'whatsapp',
        status: 'contato-realizado',
        priority: 'high',
        notes: 'Cliente potencial para WhatsApp Business'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro.costa@exemplo.com',
        phone: '(11) 99999-3333',
        company: 'Consultoria XYZ',
        source: 'referral',
        status: 'qualificado',
        priority: 'urgent',
        notes: 'Precisa de demonstração urgente'
      },
      {
        name: 'Ana Oliveira',
        email: 'ana.oliveira@exemplo.com',
        phone: '(11) 99999-4444',
        company: 'Startup Inovação',
        source: 'social',
        status: 'proposta-enviada',
        priority: 'high',
        notes: 'Aguardando resposta da proposta'
      },
      {
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@exemplo.com',
        phone: '(11) 99999-5555',
        company: 'Comércio Local',
        source: 'website',
        status: 'follow-up',
        priority: 'medium',
        notes: 'Seguimento agendado para próxima semana'
      }
    ];

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .insert(leadsData)
      .select();

    if (leadsError) {
      console.error('❌ Erro ao inserir leads:', leadsError);
      return;
    }

    console.log(`✅ ${leads.length} leads inseridos`);

    // 2. Inserir clientes de exemplo
    console.log('👥 Inserindo clientes de exemplo...');
    const customersData = [
      {
        whatsapp_number: '5511999991111',
        name: 'João Silva',
        email: 'joao.silva@exemplo.com',
        company: 'Empresa ABC LTDA',
        tags: ['vip', 'website'],
        status: 'active',
        notes: 'Cliente ativo desde janeiro'
      },
      {
        whatsapp_number: '5511999992222',
        name: 'Maria Santos',
        email: 'maria.santos@exemplo.com',
        company: 'Tech Solutions',
        tags: ['whatsapp', 'potencial'],
        status: 'lead',
        notes: 'Interessada em automação'
      }
    ];

    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert(customersData)
      .select();

    if (customersError) {
      console.error('❌ Erro ao inserir clientes:', customersError);
      return;
    }

    console.log(`✅ ${customers.length} clientes inseridos`);

    // 3. Inserir conversas de exemplo
    console.log('💬 Inserindo conversas de exemplo...');
    const conversationsData = [
      {
        customer_id: customers[0].id,
        lead_id: leads[0].id,
        whatsapp_instance: 'default',
        whatsapp_number: '5511999991111',
        status: 'open',
        pipeline_status: 'contato-realizado'
      },
      {
        customer_id: customers[1].id,
        lead_id: leads[1].id,
        whatsapp_instance: 'default',
        whatsapp_number: '5511999992222',
        status: 'open',
        pipeline_status: 'qualificado'
      },
      {
        lead_id: leads[2].id,
        whatsapp_instance: 'default',
        whatsapp_number: '5511999993333',
        status: 'closed',
        pipeline_status: 'fechado-ganho'
      },
      {
        lead_id: leads[3].id,
        whatsapp_instance: 'default',
        whatsapp_number: '5511999994444',
        status: 'pending',
        pipeline_status: 'proposta-enviada'
      }
    ];

    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .insert(conversationsData)
      .select();

    if (conversationsError) {
      console.error('❌ Erro ao inserir conversas:', conversationsError);
      return;
    }

    console.log(`✅ ${conversations.length} conversas inseridas`);

    // 4. Inserir mensagens de exemplo
    console.log('💌 Inserindo mensagens de exemplo...');
    const messagesData = [
      {
        conversation_id: conversations[0].id,
        sender_type: 'customer',
        content: 'Olá! Gostaria de saber mais sobre o WhatsApp CRM',
        message_type: 'text',
        is_read: true
      },
      {
        conversation_id: conversations[0].id,
        sender_type: 'agent',
        content: 'Olá João! Obrigado pelo interesse. Posso te ajudar com informações sobre nosso CRM.',
        message_type: 'text',
        is_read: true
      },
      {
        conversation_id: conversations[1].id,
        sender_type: 'customer',
        content: 'Quanto custa a implementação?',
        message_type: 'text',
        is_read: true
      },
      {
        conversation_id: conversations[1].id,
        sender_type: 'agent',
        content: 'Vou te enviar nossa tabela de preços por email.',
        message_type: 'text',
        is_read: false
      }
    ];

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .insert(messagesData)
      .select();

    if (messagesError) {
      console.error('❌ Erro ao inserir mensagens:', messagesError);
      return;
    }

    console.log(`✅ ${messages.length} mensagens inseridas`);

    console.log('');
    console.log('🎉 Dados de exemplo inseridos com sucesso!');
    console.log('');
    console.log('📊 Resumo:');
    console.log(`- ${leads.length} leads criados`);
    console.log(`- ${customers.length} clientes criados`);
    console.log(`- ${conversations.length} conversas criadas`);
    console.log(`- ${messages.length} mensagens criadas`);
    console.log('');
    console.log('🚀 Agora você pode testar o Dashboard com dados reais!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedDashboardData();
}

module.exports = { seedDashboardData }; 