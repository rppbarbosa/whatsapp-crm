-- ===== VERIFICAR DEPENDÊNCIAS DE VIEWS =====
-- Execute este SQL para ver quais views dependem da tabela whatsapp_contacts

-- 1. Verificar views que dependem da tabela whatsapp_contacts
SELECT 
    v.viewname,
    v.definition
FROM pg_views v
WHERE v.definition LIKE '%whatsapp_contacts%'
   OR v.viewname LIKE '%whatsapp%'
   OR v.viewname LIKE '%conversation%';

-- 2. Verificar regras que dependem da tabela
SELECT 
    r.rulename,
    r.definition
FROM pg_rules r
WHERE r.definition LIKE '%whatsapp_contacts%'
   OR r.rulename LIKE '%whatsapp%'
   OR r.rulename LIKE '%conversation%';

-- 3. Verificar todas as views no schema public
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 4. Verificar se existe a view active_conversations
SELECT 
    'active_conversations view exists' as status,
    COUNT(*) as count
FROM pg_views
WHERE viewname = 'active_conversations'; 