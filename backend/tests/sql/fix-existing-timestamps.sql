-- ===== CORRIGIR TIMESTAMPS EXISTENTES =====
-- Execute este SQL para corrigir os timestamps das mensagens existentes

-- 1. Verificar timestamps atuais
SELECT 
    'Timestamps atuais' as info,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN timestamp < 1000000000000 THEN 1 END) as timestamps_pequenos,
    COUNT(CASE WHEN timestamp >= 1000000000000 THEN 1 END) as timestamps_normais,
    MIN(timestamp) as menor_timestamp,
    MAX(timestamp) as maior_timestamp
FROM whatsapp_messages
WHERE instance_name = 'test11';

-- 2. Corrigir timestamps que estão em segundos (multiplicar por 1000)
UPDATE whatsapp_messages 
SET 
    timestamp = timestamp * 1000,
    updated_at = NOW()
WHERE 
    instance_name = 'test11' 
    AND timestamp < 1000000000000;

-- 3. Verificar resultado após correção
SELECT 
    'Timestamps após correção' as info,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN timestamp < 1000000000000 THEN 1 END) as timestamps_pequenos,
    COUNT(CASE WHEN timestamp >= 1000000000000 THEN 1 END) as timestamps_normais,
    MIN(timestamp) as menor_timestamp,
    MAX(timestamp) as maior_timestamp
FROM whatsapp_messages
WHERE instance_name = 'test11';

-- 4. Mostrar exemplos de mensagens com timestamps corrigidos
SELECT 
    id,
    from_id,
    to_id,
    body,
    timestamp,
    to_char(to_timestamp(timestamp / 1000), 'YYYY-MM-DD HH24:MI:SS') as data_corrigida,
    is_from_me,
    created_at
FROM whatsapp_messages
WHERE instance_name = 'test11'
ORDER BY timestamp DESC
LIMIT 10; 