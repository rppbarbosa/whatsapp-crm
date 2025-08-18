-- ===== CORRIGIR DUPLICAÇÕES DE GRUPOS =====

-- 1. Atualizar nomes dos grupos
UPDATE whatsapp_contacts 
SET 
    name = 'Trabalhista bonne',
    display_name = 'Trabalhista bonne'
WHERE phone = '120363401692352115@g.us';

UPDATE whatsapp_contacts 
SET 
    name = 'Soluções tributárias',
    display_name = 'Soluções tributárias'
WHERE phone = '120363333039684748@g.us';

-- 2. Remover duplicações (manter com @g.us, remover sem @)
DELETE FROM whatsapp_contacts 
WHERE id IN ('120363401692352115', '120363333039684748');

-- 3. Verificar resultado
SELECT 
    id,
    phone,
    name,
    display_name,
    is_group
FROM whatsapp_contacts
WHERE is_group = TRUE
ORDER BY name; 