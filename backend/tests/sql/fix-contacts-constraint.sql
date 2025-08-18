-- ===== CORREÇÃO DE CONSTRAINT PARA WHATSAPP_CONTACTS =====
-- Execute este SQL no Supabase SQL Editor para corrigir o erro de constraint

-- 1. Verificar se a constraint única composta já existe
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'whatsapp_contacts_id_instance_name_unique'
    ) THEN
        -- Adicionar constraint única composta
        ALTER TABLE whatsapp_contacts 
        ADD CONSTRAINT whatsapp_contacts_id_instance_name_unique 
        UNIQUE (id, instance_name);
        
        RAISE NOTICE 'Constraint única composta adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint única composta já existe';
    END IF;
END $$;

-- 2. Verificar se há dados duplicados que possam causar problemas
WITH duplicates AS (
    SELECT id, instance_name, COUNT(*) as count
    FROM whatsapp_contacts
    GROUP BY id, instance_name
    HAVING COUNT(*) > 1
)
SELECT 
    'Encontrados ' || COUNT(*) || ' grupos de registros duplicados' as message
FROM duplicates;

-- 3. Se houver duplicados, manter apenas o mais recente
WITH duplicates AS (
    SELECT id, instance_name, COUNT(*) as count
    FROM whatsapp_contacts
    GROUP BY id, instance_name
    HAVING COUNT(*) > 1
),
ranked_contacts AS (
    SELECT 
        id,
        instance_name,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY id, instance_name 
            ORDER BY created_at DESC
        ) as rn
    FROM whatsapp_contacts
    WHERE (id, instance_name) IN (
        SELECT id, instance_name FROM duplicates
    )
)
DELETE FROM whatsapp_contacts 
WHERE (id, instance_name, created_at) IN (
    SELECT id, instance_name, created_at 
    FROM ranked_contacts 
    WHERE rn > 1
);

-- 4. Verificar se a tabela está correta
SELECT 
    'Tabela whatsapp_contacts corrigida' as status,
    COUNT(*) as total_contacts,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(DISTINCT (id, instance_name)) as unique_combinations
FROM whatsapp_contacts;

-- 5. Verificar constraints existentes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'whatsapp_contacts'
ORDER BY tc.constraint_type, kcu.ordinal_position; 