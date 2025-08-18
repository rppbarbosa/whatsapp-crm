-- ===== VERIFICAR INSTÂNCIAS NO BANCO =====
-- Execute este SQL para ver quais instâncias estão disponíveis

-- 1. Verificar instâncias no banco
SELECT 
    instance_name,
    status,
    phone_number,
    created_at,
    updated_at
FROM whatsapp_instances
ORDER BY created_at DESC;

-- 2. Verificar status das instâncias
SELECT 
    'Status das instâncias' as info,
    COUNT(*) as total_instances,
    COUNT(CASE WHEN status = 'connected' THEN 1 END) as connected,
    COUNT(CASE WHEN status = 'connecting' THEN 1 END) as connecting,
    COUNT(CASE WHEN status = 'disconnected' THEN 1 END) as disconnected
FROM whatsapp_instances; 