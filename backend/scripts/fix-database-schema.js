const { supabaseAdmin } = require('../src/services/supabase');

async function fixDatabaseSchema() {
  console.log('🔧 Verificando e corrigindo schema do banco de dados...');
  
  try {
    // 1. Verificar se a tabela whatsapp_instances existe
    console.log('📋 Verificando tabela whatsapp_instances...');
    
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'whatsapp_instances')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Erro ao verificar tabelas:', tableError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('⚠️ Tabela whatsapp_instances não existe. Criando...');
      
      // Criar tabela
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            instance_name TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr_ready')),
            qr_code TEXT,
            phone_number TEXT,
            user_id UUID,
            webhook_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
        return;
      }
      
      console.log('✅ Tabela whatsapp_instances criada com sucesso');
    } else {
      console.log('✅ Tabela whatsapp_instances existe');
    }
    
    // 2. Verificar colunas da tabela
    console.log('📋 Verificando colunas da tabela...');
    
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'whatsapp_instances')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('❌ Erro ao verificar colunas:', columnError);
      return;
    }
    
    console.log('📊 Colunas encontradas:', columns.map(c => c.column_name));
    
    // 3. Verificar se as colunas necessárias existem
    const requiredColumns = ['qr_code', 'user_id', 'phone_number'];
    const existingColumns = columns.map(c => c.column_name);
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`⚠️ Coluna ${column} não existe. Adicionando...`);
        
        let columnType = 'TEXT';
        if (column === 'user_id') {
          columnType = 'UUID';
        }
        
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS ${column} ${columnType};`
        });
        
        if (alterError) {
          console.error(`❌ Erro ao adicionar coluna ${column}:`, alterError);
        } else {
          console.log(`✅ Coluna ${column} adicionada com sucesso`);
        }
      } else {
        console.log(`✅ Coluna ${column} já existe`);
      }
    }
    
    // 4. Testar inserção/atualização
    console.log('🧪 Testando operações na tabela...');
    
    const { error: testError } = await supabaseAdmin
      .from('whatsapp_instances')
      .upsert({
        instance_name: 'test-instance',
        status: 'disconnected',
        qr_code: 'test-qr-code',
        phone_number: '+5511999999999',
        user_id: null
      }, {
        onConflict: 'instance_name'
      });
    
    if (testError) {
      console.error('❌ Erro ao testar operações:', testError);
    } else {
      console.log('✅ Operações de teste funcionando corretamente');
    }
    
    // 5. Limpar dados de teste
    await supabaseAdmin
      .from('whatsapp_instances')
      .delete()
      .eq('instance_name', 'test-instance');
    
    console.log('🎉 Schema do banco de dados corrigido com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixDatabaseSchema().then(() => {
    console.log('✅ Script concluído');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { fixDatabaseSchema };
