-- ===== ATUALIZAR CONTATOS EXISTENTES =====
-- Execute este SQL para classificar corretamente os contatos existentes

-- 1. Verificar alguns exemplos de contatos antes da atualização
SELECT 
    id,
    phone,
    name,
    is_group,
    id_type,
    original_id
FROM whatsapp_contacts
LIMIT 10;

-- 2. Forçar atualização de TODOS os registros (não apenas onde original_id IS NULL)
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
WHERE original_id IS NULL OR original_id = '';

-- 3. Verificar alguns exemplos após a atualização
SELECT 
    id,
    phone,
    name,
    is_group,
    id_type,
    original_id
FROM whatsapp_contacts
LIMIT 10;

-- 4. Verificar estatísticas atualizadas
SELECT 
    'Estatísticas dos contatos' as info,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_group = TRUE THEN 1 END) as groups,
    COUNT(CASE WHEN is_group = FALSE THEN 1 END) as contacts,
    COUNT(CASE WHEN id_type = 'group' THEN 1 END) as group_type,
    COUNT(CASE WHEN id_type = 'contact' THEN 1 END) as contact_type,
    COUNT(CASE WHEN id_type = 'unknown' THEN 1 END) as unknown_type
FROM whatsapp_contacts;

-- 5. Verificar contatos com números longos (possíveis grupos)
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    is_group,
    id_type
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 6. Verificar contatos com @ no número
SELECT 
    id,
    phone,
    name,
    is_group,
    id_type
FROM whatsapp_contacts
WHERE phone LIKE '%@%'
ORDER BY phone
LIMIT 10; 