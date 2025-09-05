const { supabaseAdmin } = require('../src/services/supabase');

async function fixSchema() {
  console.log('🔧 Corrigindo schema do banco de dados...');
  
  try {
    // SQL para corrigir a tabela whatsapp_instances
    const fixSQL = `
      -- Criar tabela se não existir
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
      
      -- Adicionar colunas se não existirem
      DO $$ 
      BEGIN
        -- Adicionar qr_code se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'qr_code') THEN
          ALTER TABLE public.whatsapp_instances ADD COLUMN qr_code TEXT;
        END IF;
        
        -- Adicionar user_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'user_id') THEN
          ALTER TABLE public.whatsapp_instances ADD COLUMN user_id UUID;
        END IF;
        
        -- Adicionar phone_number se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'phone_number') THEN
          ALTER TABLE public.whatsapp_instances ADD COLUMN phone_number TEXT;
        END IF;
        
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'updated_at') THEN
          ALTER TABLE public.whatsapp_instances ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
      END $$;
    `;
    
    // Executar SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      return false;
    }
    
    console.log('✅ Schema corrigido com sucesso!');
    
    // Testar a tabela
    const { data, error: testError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError);
      return false;
    }
    
    console.log('✅ Tabela funcionando corretamente');
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixSchema().then(success => {
    if (success) {
      console.log('🎉 Correção concluída com sucesso!');
      process.exit(0);
    } else {
      console.log('❌ Correção falhou');
      process.exit(1);
    }
  });
}

module.exports = { fixSchema };
