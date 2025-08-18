-- ===== LIMPEZA DE TABELAS NÃO UTILIZADAS =====
-- Execute este SQL no Supabase SQL Editor para limpar tabelas desnecessárias

-- ===== ANÁLISE DO RELATÓRIO =====
-- Baseado no relatório gerado, temos:
-- ✅ 16 tabelas no total
-- ✅ Todas as tabelas estão sendo utilizadas (referenciadas no código)
-- 📭 14 tabelas vazias
-- 💾 2 tabelas com dados: ai_configs (1) e whatsapp_instances (2)

-- ===== RECOMENDAÇÕES DE LIMPEZA =====

-- 1. TABELAS QUE PODEM SER REMOVIDAS (vazias e não críticas):
-- ❌ active_conversations - View/relatório que pode ser recriada
-- ❌ activity_logs - Logs que podem ser recriados
-- ❌ auto_responses - Configurações que podem ser recriadas
-- ❌ conversion_metrics - Métricas que podem ser recriadas
-- ❌ pipeline_activities - Atividades que podem ser recriadas
-- ❌ profiles - Perfis que podem ser recriados

-- 2. TABELAS QUE DEVEM SER MANTIDAS:
-- ✅ whatsapp_contacts - Essencial para o WhatsApp
-- ✅ whatsapp_messages - Essencial para o WhatsApp  
-- ✅ whatsapp_instances - Essencial para o WhatsApp (tem dados)
-- ✅ whatsapp_crm_relationships - Essencial para integração
-- ✅ whatsapp_contact_relationships - Essencial para integração
-- ✅ leads - Essencial para CRM
-- ✅ customers - Essencial para CRM
-- ✅ leads_dashboard - Essencial para dashboard
-- ✅ metrics - Essencial para analytics
-- ✅ ai_configs - Tem dados, pode ser importante

-- ===== SCRIPT DE LIMPEZA =====

-- 1. Fazer backup das tabelas antes de remover (opcional)
-- CREATE TABLE backup_active_conversations AS SELECT * FROM active_conversations;
-- CREATE TABLE backup_activity_logs AS SELECT * FROM activity_logs;
-- CREATE TABLE backup_auto_responses AS SELECT * FROM auto_responses;
-- CREATE TABLE backup_conversion_metrics AS SELECT * FROM conversion_metrics;
-- CREATE TABLE backup_pipeline_activities AS SELECT * FROM pipeline_activities;
-- CREATE TABLE backup_profiles AS SELECT * FROM profiles;

-- 2. Remover tabelas vazias e não críticas
-- DESCOMENTE AS LINHAS ABAIXO SE QUISER REMOVER AS TABELAS

-- DROP TABLE IF EXISTS active_conversations CASCADE;
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS auto_responses CASCADE;
-- DROP TABLE IF EXISTS conversion_metrics CASCADE;
-- DROP TABLE IF EXISTS pipeline_activities CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ===== SCRIPT DE OTIMIZAÇÃO =====

-- 3. Criar índices para melhorar performance das tabelas principais
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_name ON whatsapp_contacts(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_name ON whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_id ON whatsapp_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_id ON whatsapp_messages(to_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 4. Verificar integridade referencial
-- Verificar se há foreign keys quebradas
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public';

-- 5. Estatísticas das tabelas mantidas
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
AND tablename IN (
    'whatsapp_contacts',
    'whatsapp_messages', 
    'whatsapp_instances',
    'whatsapp_crm_relationships',
    'whatsapp_contact_relationships',
    'leads',
    'customers',
    'leads_dashboard',
    'metrics',
    'ai_configs'
)
ORDER BY tablename, attname;

-- 6. Verificar tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- ===== SCRIPT DE MANUTENÇÃO =====

-- 7. Vacuum e analyze para otimizar performance
VACUUM ANALYZE whatsapp_contacts;
VACUUM ANALYZE whatsapp_messages;
VACUUM ANALYZE whatsapp_instances;
VACUUM ANALYZE whatsapp_crm_relationships;
VACUUM ANALYZE whatsapp_contact_relationships;
VACUUM ANALYZE leads;
VACUUM ANALYZE customers;
VACUUM ANALYZE leads_dashboard;
VACUUM ANALYZE metrics;
VACUUM ANALYZE ai_configs;

-- ===== RESUMO FINAL =====

-- 8. Contar registros nas tabelas mantidas
SELECT 
    'whatsapp_contacts' as table_name,
    COUNT(*) as record_count
FROM whatsapp_contacts
UNION ALL
SELECT 
    'whatsapp_messages' as table_name,
    COUNT(*) as record_count
FROM whatsapp_messages
UNION ALL
SELECT 
    'whatsapp_instances' as table_name,
    COUNT(*) as record_count
FROM whatsapp_instances
UNION ALL
SELECT 
    'whatsapp_crm_relationships' as table_name,
    COUNT(*) as record_count
FROM whatsapp_crm_relationships
UNION ALL
SELECT 
    'whatsapp_contact_relationships' as table_name,
    COUNT(*) as record_count
FROM whatsapp_contact_relationships
UNION ALL
SELECT 
    'leads' as table_name,
    COUNT(*) as record_count
FROM leads
UNION ALL
SELECT 
    'customers' as table_name,
    COUNT(*) as record_count
FROM customers
UNION ALL
SELECT 
    'leads_dashboard' as table_name,
    COUNT(*) as record_count
FROM leads_dashboard
UNION ALL
SELECT 
    'metrics' as table_name,
    COUNT(*) as record_count
FROM metrics
UNION ALL
SELECT 
    'ai_configs' as table_name,
    COUNT(*) as record_count
FROM ai_configs
ORDER BY record_count DESC;

-- ===== INSTRUÇÕES =====
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Revise os resultados antes de remover qualquer tabela
-- 3. Se quiser remover tabelas, descomente as linhas DROP TABLE
-- 4. Execute novamente para verificar o resultado final
--
-- ===== TABELAS ESSENCIAIS MANTIDAS =====
-- ✅ whatsapp_contacts - Contatos do WhatsApp
-- ✅ whatsapp_messages - Mensagens do WhatsApp
-- ✅ whatsapp_instances - Instâncias do WhatsApp
-- ✅ whatsapp_crm_relationships - Relacionamentos CRM
-- ✅ whatsapp_contact_relationships - Relacionamentos de contatos
-- ✅ leads - Leads do CRM
-- ✅ customers - Clientes do CRM
-- ✅ leads_dashboard - Dashboard de leads
-- ✅ metrics - Métricas do sistema
-- ✅ ai_configs - Configurações de IA 