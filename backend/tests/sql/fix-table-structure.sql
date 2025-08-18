-- Script para corrigir a estrutura da tabela whatsapp_instances
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar colunas faltantes se não existirem
DO $$ 
BEGIN
    -- Adicionar coluna status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.whatsapp_instances ADD COLUMN status text DEFAULT 'connecting';
        RAISE NOTICE 'Coluna status adicionada';
    ELSE
        RAISE NOTICE 'Coluna status já existe';
    END IF;

    -- Adicionar coluna instance_name se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances' 
        AND column_name = 'instance_name'
    ) THEN
        ALTER TABLE public.whatsapp_instances ADD COLUMN instance_name text;
        RAISE NOTICE 'Coluna instance_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna instance_name já existe';
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.whatsapp_instances ADD COLUMN updated_at timestamptz DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;

END $$;

-- 2. Atualizar registros existentes
UPDATE public.whatsapp_instances 
SET 
    instance_name = COALESCE(instance_name, 'instance-' || substring(id::text from 1 for 8)),
    status = COALESCE(status, 'connecting'),
    updated_at = COALESCE(updated_at, created_at)
WHERE instance_name IS NULL OR status IS NULL OR updated_at IS NULL;

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_instances' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar dados
SELECT * FROM public.whatsapp_instances; 