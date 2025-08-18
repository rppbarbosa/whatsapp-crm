-- ===== CORREÇÃO DO TAMANHO DO CAMPO PHONE =====
-- Execute este SQL no Supabase SQL Editor para corrigir o erro de tamanho do campo

-- 1. Verificar o tamanho atual do campo phone
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_contacts' 
AND column_name = 'phone';

-- 2. Alterar o tamanho do campo phone para suportar números maiores
ALTER TABLE whatsapp_contacts 
ALTER COLUMN phone TYPE VARCHAR(50);

-- 3. Verificar se a alteração foi aplicada
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_contacts' 
AND column_name = 'phone';

-- 4. Verificar se há números de telefone muito longos
SELECT 
    phone,
    LENGTH(phone) as phone_length,
    COUNT(*) as count
FROM whatsapp_contacts
WHERE LENGTH(phone) > 20
GROUP BY phone, LENGTH(phone)
ORDER BY phone_length DESC
LIMIT 10;

-- 5. Verificar estatísticas gerais dos números de telefone
SELECT 
    'Estatísticas dos números de telefone' as info,
    COUNT(*) as total_contacts,
    MIN(LENGTH(phone)) as min_length,
    MAX(LENGTH(phone)) as max_length,
    AVG(LENGTH(phone)) as avg_length
FROM whatsapp_contacts
WHERE phone IS NOT NULL; 