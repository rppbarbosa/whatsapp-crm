-- Script para atualizar o status da instância test3
-- Execute este script no SQL Editor do Supabase

-- Atualizar o status da instância test3 para 'connected'
UPDATE public.whatsapp_instances 
SET 
    status = 'connected',
    updated_at = now()
WHERE instance_name = 'test3';

-- Verificar se a atualização foi feita
SELECT 
    id,
    instance_name,
    status,
    phone_number,
    created_at,
    updated_at
FROM public.whatsapp_instances 
WHERE instance_name = 'test3';

-- Verificar todas as instâncias
SELECT 
    id,
    instance_name,
    status,
    phone_number,
    created_at,
    updated_at
FROM public.whatsapp_instances 
ORDER BY created_at DESC; 