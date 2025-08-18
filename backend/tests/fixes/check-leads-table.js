const { supabase } = require('./src/services/supabase.js');

async function checkLeadsTable() {
  console.log('🔍 Verificando se a tabela leads existe...');

  try {
    // Tentar fazer uma consulta simples na tabela leads
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Tabela leads não existe ou há erro:', error.message);
      
      if (error.message.includes('relation "leads" does not exist')) {
        console.log('📋 Criando tabela leads...');
        await createLeadsTable();
      } else {
        console.error('❌ Erro desconhecido:', error);
      }
    } else {
      console.log('✅ Tabela leads existe e está funcionando!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
  }
}

async function createLeadsTable() {
  try {
    // SQL para criar a tabela leads
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.leads (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        source TEXT DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'referral', 'social', 'other')),
        status TEXT DEFAULT 'lead-bruto' CHECK (status IN (
          'lead-bruto', 
          'contato-realizado', 
          'qualificado', 
          'proposta-enviada', 
          'follow-up', 
          'fechado-ganho', 
          'fechado-perdido'
        )),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        notes TEXT,
        assigned_to UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Erro ao criar tabela:', error);
      return;
    }

    console.log('✅ Tabela leads criada com sucesso!');

    // Criar índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);',
      'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);',
      'CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);'
    ];

    for (const indexSQL of indexes) {
      await supabase.rpc('exec_sql', { sql: indexSQL });
    }

    console.log('✅ Índices criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkLeadsTable();
}

module.exports = { checkLeadsTable, createLeadsTable }; 