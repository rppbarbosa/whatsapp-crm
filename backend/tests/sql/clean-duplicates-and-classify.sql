-- ===== LIMPAR DUPLICAÇÕES E CLASSIFICAR CONTATOS =====
-- Execute este SQL para limpar duplicações e classificar corretamente

-- 1. Primeiro, vamos classificar corretamente baseado no tamanho do número
UPDATE whatsapp_contacts 
SET 
    is_group = CASE 
        WHEN LENGTH(phone) > 15 THEN TRUE  -- Números longos são grupos
        ELSE FALSE 
    END,
    id_type = CASE 
        WHEN LENGTH(phone) > 15 THEN 'group'  -- Números longos são grupos
        WHEN phone LIKE '%@g.us%' THEN 'group'
        WHEN phone LIKE '%@c.us%' THEN 'contact'
        WHEN phone LIKE '%@s.whatsapp.net%' THEN 'contact'
        ELSE 'contact'  -- Números normais são contatos
    END,
    original_id = phone
WHERE original_id IS NULL OR original_id = '';

-- 2. Verificar estatísticas após classificação
SELECT 
    'Estatísticas após classificação' as info,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_group = TRUE THEN 1 END) as groups,
    COUNT(CASE WHEN is_group = FALSE THEN 1 END) as contacts,
    COUNT(CASE WHEN id_type = 'group' THEN 1 END) as group_type,
    COUNT(CASE WHEN id_type = 'contact' THEN 1 END) as contact_type,
    COUNT(CASE WHEN id_type = 'unknown' THEN 1 END) as unknown_type
FROM whatsapp_contacts;

-- 3. Identificar duplicações por nome (manter apenas o contato, não o grupo)
WITH duplicates AS (
    SELECT 
        name,
        COUNT(*) as count,
        MIN(CASE WHEN is_group = FALSE THEN id END) as keep_contact_id,
        MIN(CASE WHEN is_group = TRUE THEN id END) as keep_group_id
    FROM whatsapp_contacts
    WHERE name IS NOT NULL AND name != ''
    GROUP BY name
    HAVING COUNT(*) > 1
)
SELECT 
    'Duplicações encontradas' as status,
    COUNT(*) as total_duplicates
FROM duplicates;

-- 4. Remover duplicações (manter contato, remover grupo quando ambos existem)
DELETE FROM whatsapp_contacts 
WHERE id IN (
    SELECT wc.id
    FROM whatsapp_contacts wc
    INNER JOIN (
        SELECT 
            name,
            COUNT(*) as count,
            MIN(CASE WHEN is_group = FALSE THEN id END) as keep_contact_id,
            MIN(CASE WHEN is_group = TRUE THEN id END) as keep_group_id
        FROM whatsapp_contacts
        WHERE name IS NOT NULL AND name != ''
        GROUP BY name
        HAVING COUNT(*) > 1
    ) dup ON wc.name = dup.name
    WHERE wc.is_group = TRUE 
    AND dup.keep_contact_id IS NOT NULL  -- Só remover grupo se existe contato
    AND wc.id != dup.keep_group_id  -- Não remover se é o único grupo
);

-- 5. Verificar estatísticas após limpeza
SELECT 
    'Estatísticas após limpeza' as info,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN is_group = TRUE THEN 1 END) as groups,
    COUNT(CASE WHEN is_group = FALSE THEN 1 END) as contacts,
    COUNT(CASE WHEN id_type = 'group' THEN 1 END) as group_type,
    COUNT(CASE WHEN id_type = 'contact' THEN 1 END) as contact_type,
    COUNT(CASE WHEN id_type = 'unknown' THEN 1 END) as unknown_type
FROM whatsapp_contacts;

-- 6. Verificar exemplos de grupos e contatos
SELECT 
    'Exemplos de grupos' as tipo,
    id,
    phone,
    name,
    LENGTH(phone) as phone_length
FROM whatsapp_contacts
WHERE is_group = TRUE
ORDER BY LENGTH(phone) DESC
LIMIT 5;

-- 7. Verificar exemplos de contatos
SELECT 
    'Exemplos de contatos' as tipo,
    id,
    phone,
    name,
    LENGTH(phone) as phone_length
FROM whatsapp_contacts
WHERE is_group = FALSE
ORDER BY phone
LIMIT 5; 