-- ===== INVESTIGAR DUPLICAÇÕES E CLASSIFICAR CONTATOS =====
-- Execute este SQL para entender as duplicações e classificar corretamente

-- 1. Verificar contatos com números longos (possíveis grupos)
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    is_group,
    id_type,
    created_at
FROM whatsapp_contacts
WHERE LENGTH(phone) > 15
ORDER BY LENGTH(phone) DESC
LIMIT 20;

-- 2. Verificar contatos com números normais (possíveis contatos reais)
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    is_group,
    id_type,
    created_at
FROM whatsapp_contacts
WHERE LENGTH(phone) <= 15
ORDER BY phone
LIMIT 20;

-- 3. Verificar se há duplicações baseadas no nome
SELECT 
    name,
    COUNT(*) as count,
    STRING_AGG(phone, ', ') as phones,
    STRING_AGG(id, ', ') as ids
FROM whatsapp_contacts
WHERE name IS NOT NULL AND name != ''
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 10;

-- 4. Verificar contatos que parecem ser grupos (números muito longos)
SELECT 
    'Possíveis grupos' as tipo,
    COUNT(*) as quantidade
FROM whatsapp_contacts
WHERE LENGTH(phone) > 15

UNION ALL

SELECT 
    'Contatos normais' as tipo,
    COUNT(*) as quantidade
FROM whatsapp_contacts
WHERE LENGTH(phone) <= 15;

-- 5. Verificar se há padrões nos números longos
SELECT 
    phone,
    name,
    CASE 
        WHEN phone ~ '^[0-9]+$' THEN 'Apenas números'
        WHEN phone LIKE '%@%' THEN 'Contém @'
        ELSE 'Outro formato'
    END as formato,
    LENGTH(phone) as tamanho
FROM whatsapp_contacts
WHERE LENGTH(phone) > 15
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 6. Verificar contatos com @ no número (IDs serializados)
SELECT 
    phone,
    name,
    is_group,
    id_type
FROM whatsapp_contacts
WHERE phone LIKE '%@%'
ORDER BY phone
LIMIT 10; 