-- ===== INVESTIGAÇÃO RÁPIDA DOS NÚMEROS LONGOS =====
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar os números mais longos
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    is_group
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 2. Verificar se são grupos
SELECT 
    COUNT(*) as total_groups,
    COUNT(CASE WHEN LENGTH(phone) > 20 THEN 1 END) as groups_with_long_phones
FROM whatsapp_contacts
WHERE is_group = true;

-- 3. Verificar se são IDs serializados
SELECT 
    COUNT(*) as total_with_at,
    COUNT(CASE WHEN phone LIKE '%@%' THEN 1 END) as phones_with_at
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20; 