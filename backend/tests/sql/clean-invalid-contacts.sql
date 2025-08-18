-- ===== LIMPEZA DE CONTATOS INVÁLIDOS =====
-- Execute este SQL no Supabase SQL Editor para limpar dados inválidos

-- 1. Verificar quantos contatos inválidos existem
SELECT 
    'Contatos com números muito longos (>20 chars)' as tipo,
    COUNT(*) as quantidade
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20

UNION ALL

SELECT 
    'Contatos com @ no número' as tipo,
    COUNT(*) as quantidade
FROM whatsapp_contacts
WHERE phone LIKE '%@%'

UNION ALL

SELECT 
    'Contatos com caracteres não numéricos' as tipo,
    COUNT(*) as quantidade
FROM whatsapp_contacts
WHERE phone !~ '^[0-9]+$';

-- 2. Mostrar exemplos de contatos inválidos
SELECT 
    id,
    phone,
    name,
    LENGTH(phone) as phone_length,
    CASE 
        WHEN phone LIKE '%@%' THEN 'Contém @'
        WHEN phone !~ '^[0-9]+$' THEN 'Caracteres inválidos'
        WHEN LENGTH(phone) > 20 THEN 'Muito longo'
        ELSE 'OK'
    END as problema
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20 
   OR phone LIKE '%@%'
   OR phone !~ '^[0-9]+$'
ORDER BY LENGTH(phone) DESC
LIMIT 10;

-- 3. DELETAR contatos inválidos (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM whatsapp_contacts
-- WHERE LENGTH(phone) > 20 
--    OR phone LIKE '%@%'
--    OR phone !~ '^[0-9]+$';

-- 4. Verificar resultado após limpeza
-- SELECT 
--     'Contatos válidos restantes' as status,
--     COUNT(*) as quantidade
-- FROM whatsapp_contacts; 