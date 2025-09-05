-- ===== CORRIGIR SCHEMA DO WHATSAPP =====
-- Execute este SQL no Supabase SQL Editor para corrigir a estrutura das tabelas

-- 1. APAGAR TABELAS ANTIGAS (se existirem)
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS whatsapp_instances CASCADE;

-- 2. CRIAR TABELAS NOVAS SEGUINDO A DOCUMENTAÇÃO OFICIAL

-- Tabela de instâncias do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    instance_name VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (
        status IN ('disconnected', 'connecting', 'connected', 'qr_ready', 'authenticated')
    ),
    phone_number VARCHAR(20),
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contatos do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id VARCHAR(255) PRIMARY KEY, -- ID nativo do WhatsApp (ex: 554497460856@c.us)
    name VARCHAR(255),
    phone VARCHAR(20),
    is_group BOOLEAN DEFAULT FALSE,
    is_wa_contact BOOLEAN DEFAULT FALSE,
    profile_pic_url TEXT,
    status TEXT,
    last_seen BIGINT,
    has_messages BOOLEAN DEFAULT FALSE,
    instance_name VARCHAR(255) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY, -- ID nativo do WhatsApp
    from_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    to_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    body TEXT,
    type VARCHAR(50) DEFAULT 'chat',
    timestamp BIGINT, -- Unix timestamp
    is_from_me BOOLEAN DEFAULT FALSE,
    media_url TEXT,
    media_type VARCHAR(50),
    media_filename VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent',
    conversation_id VARCHAR(255), -- ID da conversa (from_id ou to_id, dependendo de quem iniciou)
    instance_name VARCHAR(255) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE

-- Índices para whatsapp_instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_phone ON whatsapp_instances(phone_number);

-- Índices para whatsapp_contacts
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance ON whatsapp_contacts(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_group ON whatsapp_contacts(is_group);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_has_messages ON whatsapp_contacts(has_messages);

-- Índices para whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_id ON whatsapp_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_id ON whatsapp_messages(to_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(from_id, to_id, timestamp);

-- 4. CRIAR VIEWS PARA CONSULTAS SIMPLIFICADAS

-- View para conversas com última mensagem
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.phone as contact_phone,
    c.profile_pic_url as contact_avatar,
    c.status as contact_status,
    c.is_business as contact_is_business,
    c.is_verified as contact_is_verified,
    c.instance_name,
    m.body as last_message_body,
    m.timestamp as last_message_timestamp,
    m.is_from_me as last_message_is_from_me,
    COUNT(msg.id) as message_count
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON (
    m.id = (
        SELECT id FROM whatsapp_messages 
        WHERE (from_id = c.id OR to_id = c.id) 
        AND instance_name = c.instance_name
        ORDER BY timestamp DESC 
        LIMIT 1
    )
)
LEFT JOIN whatsapp_messages msg ON (
    (msg.from_id = c.id OR msg.to_id = c.id) 
    AND msg.instance_name = c.instance_name
)
WHERE c.has_messages = TRUE
GROUP BY c.id, c.name, c.phone, c.profile_pic_url, c.status, c.is_business, c.is_verified, c.instance_name, m.body, m.timestamp, m.is_from_me;

-- 5. CRIAR FUNÇÕES ÚTEIS

-- Função para obter mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_conversation_messages(
    instance_name_param VARCHAR(255),
    contact_id_param VARCHAR(255),
    limit_param INTEGER DEFAULT 50
)
RETURNS TABLE (
    id VARCHAR(255),
    from_id VARCHAR(255),
    to_id VARCHAR(255),
    body TEXT,
    type VARCHAR(50),
    timestamp BIGINT,
    is_from_me BOOLEAN,
    media_url TEXT,
    media_type VARCHAR(50),
    media_filename VARCHAR(255),
    status VARCHAR(50),
    instance_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.from_id,
        m.to_id,
        m.body,
        m.type,
        m.timestamp,
        m.is_from_me,
        m.media_url,
        m.media_type,
        m.media_filename,
        m.status,
        m.instance_name,
        m.created_at,
        m.updated_at
    FROM whatsapp_messages m
    WHERE m.instance_name = instance_name_param
    AND (m.from_id = contact_id_param OR m.to_id = contact_id_param)
    ORDER BY m.timestamp ASC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- 6. CRIAR TRIGGERS

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_whatsapp_instances_updated_at
    BEFORE UPDATE ON whatsapp_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. HABILITAR RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todas as operações para o serviço)
CREATE POLICY "Allow all operations on whatsapp_instances" ON whatsapp_instances
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on whatsapp_contacts" ON whatsapp_contacts
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (true);

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO

COMMENT ON TABLE whatsapp_instances IS 'Instâncias do WhatsApp conectadas ao sistema';
COMMENT ON TABLE whatsapp_contacts IS 'Contatos do WhatsApp sincronizados';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp armazenadas';

COMMENT ON COLUMN whatsapp_contacts.has_messages IS 'Flag indicando se o contato possui mensagens';
COMMENT ON COLUMN whatsapp_messages.timestamp IS 'Timestamp Unix da mensagem';
COMMENT ON COLUMN whatsapp_messages.conversation_id IS 'ID da conversa para agrupar mensagens';

-- ===== FIM DO SCHEMA CORRIGIDO =====
