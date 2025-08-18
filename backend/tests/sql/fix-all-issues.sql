-- ===== CORREÇÃO COMPLETA DO SISTEMA WHATSAPP =====
-- Execute este SQL no Supabase SQL Editor para corrigir todos os problemas

-- 1. CORRIGIR FUNÇÃO get_instance_conversations
DROP FUNCTION IF EXISTS get_instance_conversations(VARCHAR(255));

CREATE OR REPLACE FUNCTION get_instance_conversations(instance_name_param VARCHAR(255))
RETURNS TABLE (
    contact_id VARCHAR(255),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    last_message_body TEXT,
    last_message_timestamp BIGINT,
    message_count BIGINT,
    instance_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        m.body,
        m.timestamp,
        COUNT(msg.id)::BIGINT,
        c.instance_name
    FROM whatsapp_contacts c
    LEFT JOIN whatsapp_messages m ON (
        m.id = (
            SELECT id 
            FROM whatsapp_messages 
            WHERE (from_id = c.id OR to_id = c.id) 
            AND m.instance_name = c.instance_name
            ORDER BY timestamp DESC 
            LIMIT 1
        )
    )
    LEFT JOIN whatsapp_messages msg ON (
        (msg.from_id = c.id OR msg.to_id = c.id) 
        AND msg.instance_name = c.instance_name
    )
    WHERE c.instance_name = instance_name_param 
    AND c.has_messages = TRUE
    GROUP BY c.id, c.name, c.phone, m.body, m.timestamp, c.instance_name
    ORDER BY m.timestamp DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 2. ADICIONAR COLUNA PARA QR CODE NA TABELA DE INSTÂNCIAS
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS session_data JSONB;

-- 3. CRIAR FUNÇÃO PARA RESTAURAR INSTÂNCIAS ATIVAS
CREATE OR REPLACE FUNCTION get_active_instances()
RETURNS TABLE (
    instance_name VARCHAR(255),
    status VARCHAR(50),
    phone_number VARCHAR(20),
    qr_code TEXT,
    session_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wi.instance_name,
        wi.status,
        wi.phone_number,
        wi.qr_code,
        wi.session_data,
        wi.created_at,
        wi.updated_at
    FROM whatsapp_instances wi
    WHERE wi.status IN ('connecting', 'connected')
    ORDER BY wi.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAR FUNÇÃO PARA SINCRONIZAR CONTATOS
CREATE OR REPLACE FUNCTION sync_instance_contacts(instance_name_param VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    contact_count INTEGER := 0;
BEGIN
    -- Marcar todos os contatos da instância como não sincronizados
    UPDATE whatsapp_contacts 
    SET is_synced = FALSE 
    WHERE instance_name = instance_name_param;
    
    -- Retornar número de contatos para sincronizar
    SELECT COUNT(*) INTO contact_count
    FROM whatsapp_contacts 
    WHERE instance_name = instance_name_param;
    
    RETURN contact_count;
END;
$$ LANGUAGE plpgsql;

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR MENSAGENS
CREATE OR REPLACE FUNCTION sync_instance_messages(instance_name_param VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    message_count INTEGER := 0;
BEGIN
    -- Marcar todas as mensagens da instância como não sincronizadas
    UPDATE whatsapp_messages 
    SET is_synced = FALSE 
    WHERE instance_name = instance_name_param;
    
    -- Retornar número de mensagens para sincronizar
    SELECT COUNT(*) INTO message_count
    FROM whatsapp_messages 
    WHERE instance_name = instance_name_param;
    
    RETURN message_count;
END;
$$ LANGUAGE plpgsql;

-- 6. ADICIONAR ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_name ON whatsapp_contacts(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_name ON whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_has_messages ON whatsapp_contacts(has_messages);

-- 7. CRIAR VIEW PARA CONVERSAS ATIVAS
CREATE OR REPLACE VIEW active_conversations AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.phone as contact_phone,
    c.instance_name,
    m.body as last_message_body,
    m.timestamp as last_message_timestamp,
    COUNT(msg.id) as message_count
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON (
    m.id = (
        SELECT id 
        FROM whatsapp_messages 
        WHERE (from_id = c.id OR to_id = c.id) 
        AND m.instance_name = c.instance_name
        ORDER BY timestamp DESC 
        LIMIT 1
    )
)
LEFT JOIN whatsapp_messages msg ON (
    (msg.from_id = c.id OR msg.to_id = c.id) 
    AND msg.instance_name = c.instance_name
)
WHERE c.has_messages = TRUE
GROUP BY c.id, c.name, c.phone, c.instance_name, m.body, m.timestamp;

-- 8. TESTAR AS FUNÇÕES
SELECT 'Testando função get_instance_conversations...' as test;
SELECT * FROM get_instance_conversations('test11') LIMIT 5;

SELECT 'Testando função get_active_instances...' as test;
SELECT * FROM get_active_instances();

-- ✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO! 