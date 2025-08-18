-- ===== CORREÇÃO DA FUNÇÃO get_instance_conversations =====
-- Execute este SQL no Supabase SQL Editor para corrigir a ambiguidade

-- Remover a função antiga
DROP FUNCTION IF EXISTS get_instance_conversations(VARCHAR(255));

-- Recriar a função corrigida
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

-- Testar a função
SELECT * FROM get_instance_conversations('teste11');

-- ✅ FUNÇÃO CORRIGIDA COM SUCESSO! 