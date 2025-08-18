-- ===== SCHEMA NATIVO DO WHATSAPP =====
-- Seguindo exatamente a estrutura da API oficial do WhatsApp Web.js

-- Tabela de instâncias (mantém compatibilidade)
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

-- Tabela de contatos nativa do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    -- ID nativo do WhatsApp (ex: 554497460856@c.us, 120363206709263390@g.us)
    id VARCHAR(255) PRIMARY KEY,
    
    -- Dados básicos
    name VARCHAR(255),
    phone VARCHAR(20),
    
    -- Flags do WhatsApp
    is_group BOOLEAN DEFAULT FALSE,
    is_wa_contact BOOLEAN DEFAULT FALSE,
    
    -- Dados opcionais
    profile_pic_url TEXT,
    status TEXT,
    last_seen BIGINT,
    
    -- Metadados
    instance_name VARCHAR(255) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens nativa do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    -- ID nativo do WhatsApp (ex: false_120363419796610377@g.us_3EB009E89A99ABDF23C926_554499347713@c.us)
    id VARCHAR(255) PRIMARY KEY,
    
    -- IDs de origem e destino (nativos do WhatsApp)
    from_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    to_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    
    -- Conteúdo da mensagem
    body TEXT,
    type VARCHAR(50) DEFAULT 'chat', -- chat, image, video, audio, document, etc.
    
    -- Metadados do WhatsApp
    timestamp BIGINT, -- Unix timestamp
    is_from_me BOOLEAN DEFAULT FALSE,
    
    -- Dados de mídia (se aplicável)
    media_url TEXT,
    media_type VARCHAR(50),
    media_filename VARCHAR(255),
    
    -- Status da mensagem
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read, failed
    
    -- Metadados
    instance_name VARCHAR(255) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamentos CRM (opcional)
CREATE TABLE IF NOT EXISTS whatsapp_crm_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Referência ao contato do WhatsApp (ID nativo)
    whatsapp_contact_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    
    -- Relacionamentos com CRM
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Pipeline de vendas
    pipeline_status VARCHAR(50) DEFAULT 'lead-bruto' CHECK (
        pipeline_status IN (
            'lead-bruto', 'contato-realizado', 'qualificado', 
            'proposta-enviada', 'follow-up', 'fechado-ganho', 
            'fechado-perdido', 'cliente'
        )
    ),
    
    -- Metadados
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ÍNDICES PARA PERFORMANCE =====

-- Índices para contatos
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance ON whatsapp_contacts(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_group ON whatsapp_contacts(is_group);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_id ON whatsapp_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_id ON whatsapp_messages(to_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(from_id, to_id, timestamp);

-- Índices para relacionamentos CRM
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_contact ON whatsapp_crm_relationships(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_lead ON whatsapp_crm_relationships(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_customer ON whatsapp_crm_relationships(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_crm_pipeline ON whatsapp_crm_relationships(pipeline_status);

-- ===== VIEWS PARA FACILITAR CONSULTAS =====

-- View de conversas com última mensagem
CREATE OR REPLACE VIEW whatsapp_conversations AS
SELECT 
    c.id as contact_id,
    c.name as contact_name,
    c.phone as contact_phone,
    c.is_group,
    c.instance_name,
    m.id as last_message_id,
    m.body as last_message_body,
    m.timestamp as last_message_timestamp,
    m.is_from_me as last_message_from_me,
    m.status as last_message_status,
    COUNT(m.id) as message_count,
    MAX(m.timestamp) as last_activity
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON (c.id = m.from_id OR c.id = m.to_id)
WHERE c.is_group = FALSE
GROUP BY c.id, c.name, c.phone, c.is_group, c.instance_name, m.id, m.body, m.timestamp, m.is_from_me, m.status
ORDER BY last_activity DESC NULLS LAST;

-- View de conversas com dados do CRM
CREATE OR REPLACE VIEW whatsapp_conversations_with_crm AS
SELECT 
    c.*,
    r.lead_id,
    r.customer_id,
    r.pipeline_status,
    r.notes as crm_notes,
    r.priority,
    r.tags,
    l.name as lead_name,
    l.email as lead_email,
    l.phone as lead_phone,
    cust.name as customer_name,
    cust.email as customer_email
FROM whatsapp_conversations c
LEFT JOIN whatsapp_crm_relationships r ON c.contact_id = r.whatsapp_contact_id
LEFT JOIN leads l ON r.lead_id = l.id
LEFT JOIN customers cust ON r.customer_id = cust.id;

-- ===== FUNÇÕES ÚTEIS =====

-- Função para obter conversas de uma instância
CREATE OR REPLACE FUNCTION get_instance_conversations(instance_name_param VARCHAR(255))
RETURNS TABLE (
    contact_id VARCHAR(255),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    last_message_body TEXT,
    last_message_timestamp BIGINT,
    message_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.contact_id,
        c.contact_name,
        c.contact_phone,
        c.last_message_body,
        c.last_message_timestamp,
        c.message_count
    FROM whatsapp_conversations c
    WHERE c.instance_name = instance_name_param
    ORDER BY c.last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Função para obter mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_conversation_messages(
    contact_id_param VARCHAR(255),
    instance_name_param VARCHAR(255),
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id VARCHAR(255),
    from_id VARCHAR(255),
    to_id VARCHAR(255),
    body TEXT,
    type VARCHAR(50),
    timestamp BIGINT,
    is_from_me BOOLEAN,
    status VARCHAR(50)
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
        m.status
    FROM whatsapp_messages m
    WHERE m.instance_name = instance_name_param
    AND (m.from_id = contact_id_param OR m.to_id = contact_id_param)
    ORDER BY m.timestamp DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===== TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA =====

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_crm_relationships_updated_at
    BEFORE UPDATE ON whatsapp_crm_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== COMENTÁRIOS =====

COMMENT ON TABLE whatsapp_contacts IS 'Contatos nativos do WhatsApp usando IDs oficiais';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens nativas do WhatsApp usando IDs oficiais';
COMMENT ON TABLE whatsapp_crm_relationships IS 'Relacionamentos opcionais com CRM';
COMMENT ON VIEW whatsapp_conversations IS 'View de conversas com última mensagem';
COMMENT ON VIEW whatsapp_conversations_with_crm IS 'View de conversas com dados do CRM'; 