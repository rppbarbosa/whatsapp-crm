-- ===== CORREÇÃO COMPLETA DO CAMPO PHONE (COM FIX DE VIEW) =====
-- Execute este SQL no Supabase SQL Editor para aceitar dados crus

-- 1. Verificar se a view active_conversations existe e removê-la
DROP VIEW IF EXISTS active_conversations CASCADE;

-- 2. Verificar se há outras views que dependem da tabela whatsapp_contacts
-- e removê-las temporariamente
DROP VIEW IF EXISTS whatsapp_conversations_with_crm CASCADE;
DROP VIEW IF EXISTS whatsapp_contacts_complete CASCADE;

-- 3. Agora podemos alterar a tabela com segurança
ALTER TABLE whatsapp_contacts 
ALTER COLUMN phone TYPE VARCHAR(255);

-- 4. Adicionar campos novos
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS original_id VARCHAR(255);

ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT 'contact';

-- 5. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone 
ON whatsapp_contacts(phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_group 
ON whatsapp_contacts(is_group);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_id_type 
ON whatsapp_contacts(id_type);

-- 6. Atualizar registros existentes para identificar grupos
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

-- 7. Recriar a view active_conversations (se necessário)
CREATE OR REPLACE VIEW active_conversations AS
SELECT 
    wc.id as contact_id,
    wc.name as contact_name,
    wc.phone as contact_phone,
    wc.display_name,
    wc.profile_pic_url,
    wc.is_group,
    wc.id_type,
    wc.has_messages,
    wc.created_at,
    wc.updated_at,
    COUNT(wm.id) as message_count,
    MAX(wm.timestamp) as last_message_timestamp
FROM whatsapp_contacts wc
LEFT JOIN whatsapp_messages wm ON wc.id = wm.from_id OR wc.id = wm.to_id
WHERE wc.has_messages = true
GROUP BY wc.id, wc.name, wc.phone, wc.display_name, wc.profile_pic_url, 
         wc.is_group, wc.id_type, wc.has_messages, wc.created_at, wc.updated_at
ORDER BY last_message_timestamp DESC NULLS LAST;

-- 8. Verificar se a alteração foi aplicada
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_contacts' 
AND column_name IN ('phone', 'is_group', 'original_id', 'id_type');

-- 9. Verificar estatísticas após atualização
SELECT 
    'Estatísticas dos contatos' as info,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_group = TRUE THEN 1 END) as groups,
    COUNT(CASE WHEN is_group = FALSE THEN 1 END) as contacts,
    COUNT(CASE WHEN id_type = 'group' THEN 1 END) as group_type,
    COUNT(CASE WHEN id_type = 'contact' THEN 1 END) as contact_type,
    COUNT(CASE WHEN id_type = 'unknown' THEN 1 END) as unknown_type
FROM whatsapp_contacts; 