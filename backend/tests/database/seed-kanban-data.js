require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.js');

async function seedKanbanData() {
  console.log('🌱 Inserindo dados de exemplo para o Kanban...\n');

  try {
    // 1. Inserir leads de exemplo
    console.log('1️⃣ Inserindo leads de exemplo...');
    
    const sampleLeads = [
      {
        name: 'João Silva',
        email: 'joao@empresa.com',
        phone: '(11) 99999-9999',
        campaign: 'Google Ads',
        source: 'website',
        status: 'lead-bruto',
        priority: 'high',
        notes: 'Novo lead capturado do website - interesse em automação'
      },
      {
        name: 'Maria Santos',
        email: 'maria@tech.com',
        phone: '(11) 88888-8888',
        campaign: 'Facebook Ads',
        source: 'social',
        status: 'contato-realizado',
        priority: 'medium',
        notes: 'Contato realizado via WhatsApp - aguardando resposta'
      },
      {
        name: 'Pedro Costa',
        email: 'pedro@startup.com',
        phone: '(11) 77777-7777',
        campaign: 'LinkedIn Ads',
        source: 'social',
        status: 'qualificado',
        priority: 'high',
        notes: 'Lead qualificado - interesse em automação e integração'
      },
      {
        name: 'Ana Oliveira',
        email: 'ana@consultoria.com',
        phone: '(11) 66666-6666',
        campaign: 'Email Marketing',
        source: 'website',
        status: 'proposta-enviada',
        priority: 'medium',
        notes: 'Proposta enviada - R$ 5.000/mês - aguardando aprovação'
      },
      {
        name: 'Carlos Mendes',
        email: 'carlos@empresa.com',
        phone: '(11) 55555-5555',
        campaign: 'WhatsApp Business',
        source: 'whatsapp',
        status: 'follow-up',
        priority: 'low',
        notes: 'Follow-up agendado para amanhã às 14h'
      },
      {
        name: 'Fernanda Lima',
        email: 'fernanda@startup.com',
        phone: '(11) 44444-4444',
        campaign: 'SEO',
        source: 'website',
        status: 'fechado-ganho',
        priority: 'high',
        notes: 'Deal fechado! R$ 8.000/mês - contrato assinado'
      },
      {
        name: 'Roberto Alves',
        email: 'roberto@consultoria.com',
        phone: '(11) 33333-3333',
        campaign: 'Cold Call',
        source: 'other',
        status: 'fechado-perdido',
        priority: 'low',
        notes: 'Lead perdido - orçamento alto para o cliente'
      }
    ];

    for (const lead of sampleLeads) {
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

    // 2. Inserir customers de exemplo
    console.log('\n2️⃣ Inserindo customers de exemplo...');
    
    const sampleCustomers = [
      {
        whatsapp_number: '5511999999999',
        name: 'Cliente WhatsApp 1',
        email: 'cliente1@teste.com',
        tags: ['ativo', 'premium'],
        status: 'active'
      },
      {
        whatsapp_number: '5511888888888',
        name: 'Cliente WhatsApp 2',
        email: 'cliente2@teste.com',
        tags: ['ativo'],
        status: 'active'
      }
    ];

    for (const customer of sampleCustomers) {
      const { data, error } = await supabaseAdmin
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) {
        console.log(`❌ Erro ao inserir customer ${customer.name}:`, error.message);
      } else {
        console.log(`✅ Customer inserido: ${customer.name}`);
      }
    }

    // 3. Inserir conversas de exemplo
    console.log('\n3️⃣ Inserindo conversas de exemplo...');
    
    const sampleConversations = [
      {
        customer_id: null,
        lead_id: null, // Será atualizado depois
        whatsapp_instance: 'instance-1',
        whatsapp_number: '5511999999999',
        status: 'open',
        pipeline_status: 'lead-bruto'
      },
      {
        customer_id: null,
        lead_id: null, // Será atualizado depois
        whatsapp_instance: 'instance-1',
        whatsapp_number: '5511888888888',
        status: 'open',
        pipeline_status: 'contato-realizado'
      }
    ];

    for (const conversation of sampleConversations) {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) {
        console.log(`❌ Erro ao inserir conversa:`, error.message);
      } else {
        console.log(`✅ Conversa inserida: ${conversation.whatsapp_number}`);
      }
    }

    // 4. Inserir mensagens de exemplo
    console.log('\n4️⃣ Inserindo mensagens de exemplo...');
    
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .limit(2);

    if (conversations && conversations.length > 0) {
      const sampleMessages = [
        {
          conversation_id: conversations[0].id,
          sender_type: 'customer',
          content: 'Olá! Gostaria de saber mais sobre seus serviços de automação.',
          message_type: 'text',
          is_read: true
        },
        {
          conversation_id: conversations[0].id,
          sender_type: 'agent',
          content: 'Olá! Obrigado pelo interesse. Posso te ajudar com informações sobre nossos serviços.',
          message_type: 'text',
          is_read: false
        },
        {
          conversation_id: conversations[1].id,
          sender_type: 'customer',
          content: 'Quanto custa o plano básico?',
          message_type: 'text',
          is_read: true
        }
      ];

      for (const message of sampleMessages) {
        const { error } = await supabaseAdmin
          .from('messages')
          .insert(message);

        if (error) {
          console.log(`❌ Erro ao inserir mensagem:`, error.message);
        } else {
          console.log(`✅ Mensagem inserida para conversa ${message.conversation_id}`);
        }
      }
    }

    console.log('\n🎉 Dados de exemplo inseridos com sucesso!');
    console.log('📊 Agora você pode testar o Kanban com dados reais.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedKanbanData();
}

module.exports = { seedKanbanData }; 