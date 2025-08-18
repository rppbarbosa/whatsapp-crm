-- ===== CORREÇÃO COMPLETA DO CAMPO PHONE =====
-- Execute este SQL no Supabase SQL Editor para aceitar dados crus

-- 1. Alterar o campo phone para aceitar números longos (IDs de grupos)
ALTER TABLE whatsapp_contacts 
ALTER COLUMN phone TYPE VARCHAR(255);

-- 2. Adicionar campo para identificar se é um grupo
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

-- 3. Adicionar campo para armazenar o ID original (serializado)
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS original_id VARCHAR(255);

-- 4. Adicionar campo para armazenar o tipo de ID (contact, group, etc.)
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT 'contact';

-- 5. Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone 
ON whatsapp_contacts(phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_group 
ON whatsapp_contacts(is_group);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_id_type 
ON whatsapp_contacts(id_type);

-- 6. Verificar se a alteração foi aplicada
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_contacts' 
AND column_name IN ('phone', 'is_group', 'original_id', 'id_type');

-- 7. Atualizar registros existentes para identificar grupos
UPDATE whatsapp_contacts 
SET 
    is_group = CASE 
        WHEN phone LIKE '%@g.us%' THEN TRUE 
        ELSE FALSE 
    END,
    id_type = CASE 
        WHEN phone LIKE '%@g.us%' THEN 'group'
        WHEN phone LIKE '%@c.us%' THEN 'contact'
        WHEN phone LIKE '%@s.whatsapp.net%' THEN 'contact'
        ELSE 'unknown'
    END,
    original_id = phone
WHERE original_id IS NULL;

-- 8. Verificar estatísticas após atualização
SELECT 
    'Estatísticas dos contatos' as info,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_group = TRUE THEN 1 END) as groups,
    COUNT(CASE WHEN is_group = FALSE THEN 1 END) as contacts,
    COUNT(CASE WHEN id_type = 'group' THEN 1 END) as group_type,
    COUNT(CASE WHEN id_type = 'contact' THEN 1 END) as contact_type,
    COUNT(CASE WHEN id_type = 'unknown' THEN 1 END) as unknown_type
FROM whatsapp_contacts; 