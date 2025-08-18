-- ===== ADICIONAR COLUNA CONVERSATION_ID =====
-- Execute este SQL no Supabase SQL Editor para adicionar a coluna conversation_id

-- Adicionar coluna conversation_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE whatsapp_messages ADD COLUMN conversation_id VARCHAR(255);
        
        -- Criar índice para a nova coluna
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id 
        ON whatsapp_messages(conversation_id);
        
        -- Atualizar registros existentes com conversation_id baseado em from_id/to_id
        UPDATE whatsapp_messages 
        SET conversation_id = CASE 
            WHEN is_from_me THEN to_id 
            ELSE from_id 
        END
        WHERE conversation_id IS NULL;
        
        RAISE NOTICE 'Coluna conversation_id adicionada e preenchida com sucesso';
    ELSE
        RAISE NOTICE 'Coluna conversation_id já existe';
    END IF;
END $$; 