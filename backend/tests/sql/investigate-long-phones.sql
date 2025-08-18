-- ===== INVESTIGAÇÃO DOS NÚMEROS DE TELEFONE LONGOS =====
-- Execute este SQL no Supabase SQL Editor para investigar o problema

-- 1. Verificar os números de telefone mais longos
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    created_at
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
ORDER BY LENGTH(phone) DESC
LIMIT 20;

-- 2. Verificar se são IDs serializados do WhatsApp
SELECT 
    id,
    phone,
    name,
    CASE 
        WHEN phone LIKE '%@%' THEN 'Contém @ (provavelmente ID serializado)'
        WHEN phone LIKE '%.%' THEN 'Contém . (provavelmente ID serializado)'
        WHEN phone ~ '^[0-9]+$' THEN 'Apenas números'
        ELSE 'Formato estranho'
    END as phone_format,
    LENGTH(phone) as phone_length
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 3. Verificar se são grupos (que têm IDs diferentes)
SELECT 
    id,
    phone,
    name,
    is_group,
    LENGTH(phone) as phone_length
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 4. Verificar estatísticas gerais
SELECT 
    'Estatísticas dos números longos' as info,
    COUNT(*) as total_long_phones,
    MIN(LENGTH(phone)) as min_length,
    MAX(LENGTH(phone)) as max_length,
    AVG(LENGTH(phone)) as avg_length
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20;

-- 5. Verificar se são IDs de mensagens ou outros objetos
SELECT 
    id,
    phone,
    name,
    SUBSTRING(phone, 1, 50) as phone_start,
    LENGTH(phone) as phone_length
FROM whatsapp_contacts
WHERE LENGTH(phone) > 30
ORDER BY LENGTH(phone) DESC
LIMIT 5; 