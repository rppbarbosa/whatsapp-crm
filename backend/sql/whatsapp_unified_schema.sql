-- ===== SCHEMA UNIFICADO DO WHATSAPP CRM =====
-- Schema limpo e eficiente para WhatsApp CRM
-- Execute este SQL no Supabase SQL Editor

-- ===== TABELAS PRINCIPAIS =====

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
    has_messages BOOLEAN DEFAULT FALSE, -- Flag para indicar se tem mensagens
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
    timestamp BIGINT,
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

-- Tabela de relacionamentos CRM
CREATE TABLE IF NOT EXISTS whatsapp_crm_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_contact_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    pipeline_status VARCHAR(50) DEFAULT 'lead-bruto' CHECK (
        pipeline_status IN (
            'lead-bruto', 'contato-realizado', 'qualificado',
            'proposta-enviada', 'follow-up', 'fechado-ganho',
            'fechado-perdido', 'cliente'
        )
    ),
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(whatsapp_contact_id)
);

-- ===== ÍNDICES PARA PERFORMANCE =====

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

-- Índices para whatsapp_crm_relationships
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_contact ON whatsapp_crm_relationships(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_lead ON whatsapp_crm_relationships(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_customer ON whatsapp_crm_relationships(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_pipeline ON whatsapp_crm_relationships(pipeline_status);

-- ===== VIEWS PARA CONSULTAS SIMPLIFICADAS =====

-- View para conversas com última mensagem
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.phone as contact_phone,
    c.instance_name,
    m.body as last_message_body,
    m.timestamp as last_message_timestamp,
    m.is_from_me as last_message_is_from_me,
    COUNT(msg.id) as message_count
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON (
    m.id = (
        SELECT id 
        FROM whatsapp_messages 
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
GROUP BY c.id, c.name, c.phone, c.instance_name, m.body, m.timestamp, m.is_from_me;

-- View para conversas com dados do CRM
CREATE OR REPLACE VIEW whatsapp_conversations_with_crm AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.phone as contact_phone,
    c.instance_name,
    conv.last_message_body,
    conv.last_message_timestamp,
    conv.message_count,
    r.pipeline_status,
    r.notes as crm_notes,
    r.priority,
    r.tags,
    l.name as lead_name,
    l.email as lead_email,
    cust.name as customer_name,
    cust.email as customer_email
FROM whatsapp_contacts c
LEFT JOIN whatsapp_conversations conv ON c.id = conv.contact_id
LEFT JOIN whatsapp_crm_relationships r ON c.id = r.whatsapp_contact_id
LEFT JOIN leads l ON r.lead_id = l.id
LEFT JOIN customers cust ON r.customer_id = cust.id
WHERE c.has_messages = TRUE;

-- ===== FUNÇÕES SQL =====

-- Função para obter conversas de uma instância
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

-- Função para obter mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_conversation_messages(
    contact_id_param VARCHAR(255),
    instance_name_param VARCHAR(255),
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

-- Função para atualizar has_messages flag
CREATE OR REPLACE FUNCTION update_contact_has_messages()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar flag has_messages quando uma mensagem é inserida/atualizada
    UPDATE whatsapp_contacts 
    SET has_messages = TRUE, updated_at = NOW()
    WHERE id IN (NEW.from_id, NEW.to_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGERS =====

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

CREATE TRIGGER update_whatsapp_crm_relationships_updated_at
    BEFORE UPDATE ON whatsapp_crm_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar has_messages
CREATE TRIGGER update_contact_has_messages_trigger
    AFTER INSERT OR UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_contact_has_messages();

-- ===== RLS (Row Level Security) =====

-- Habilitar RLS nas tabelas
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_crm_relationships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todas as operações para o serviço)
CREATE POLICY "Allow all operations on whatsapp_instances" ON whatsapp_instances
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on whatsapp_contacts" ON whatsapp_contacts
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on whatsapp_crm_relationships" ON whatsapp_crm_relationships
    FOR ALL USING (true);

-- ===== COMENTÁRIOS =====

COMMENT ON TABLE whatsapp_instances IS 'Instâncias do WhatsApp conectadas ao sistema';
COMMENT ON TABLE whatsapp_contacts IS 'Contatos do WhatsApp sincronizados';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp armazenadas';
COMMENT ON TABLE whatsapp_crm_relationships IS 'Relacionamentos entre contatos WhatsApp e dados do CRM';

COMMENT ON COLUMN whatsapp_contacts.has_messages IS 'Flag indicando se o contato possui mensagens';
COMMENT ON COLUMN whatsapp_messages.timestamp IS 'Timestamp Unix da mensagem';
COMMENT ON COLUMN whatsapp_crm_relationships.pipeline_status IS 'Status do pipeline de vendas';

-- ===== FIM DO SCHEMA ===== 