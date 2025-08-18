-- ===== CONFIGURAÇÃO DO BANCO DE DADOS WHATSAPP CRM =====
-- Execute este SQL no Supabase SQL Editor

-- 1. APAGAR TABELAS ANTIGAS (se existirem)
DROP TABLE IF EXISTS whatsapp_crm_relationships CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS whatsapp_instances CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- 2. CRIAR TABELAS NOVAS

-- Tabela de instâncias
CREATE TABLE whatsapp_instances (
    instance_name VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'disconnected',
    phone_number VARCHAR(20),
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contatos
CREATE TABLE whatsapp_contacts (
    id VARCHAR(255) PRIMARY KEY,
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

-- Tabela de mensagens
CREATE TABLE whatsapp_messages (
    id VARCHAR(255) PRIMARY KEY,
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
    instance_name VARCHAR(255) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamentos CRM
CREATE TABLE whatsapp_crm_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_contact_id VARCHAR(255) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    pipeline_status VARCHAR(50) DEFAULT 'lead-bruto',
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(whatsapp_contact_id)
);

-- 3. CRIAR ÍNDICES
CREATE INDEX idx_whatsapp_contacts_instance ON whatsapp_contacts(instance_name);
CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX idx_whatsapp_contacts_has_messages ON whatsapp_contacts(has_messages);
CREATE INDEX idx_whatsapp_messages_instance ON whatsapp_messages(instance_name);
CREATE INDEX idx_whatsapp_messages_from_id ON whatsapp_messages(from_id);
CREATE INDEX idx_whatsapp_messages_to_id ON whatsapp_messages(to_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- 4. CRIAR FUNÇÃO PARA CONVERSAS
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

-- 5. HABILITAR RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_crm_relationships ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS
CREATE POLICY "Allow all operations on whatsapp_instances" ON whatsapp_instances FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_contacts" ON whatsapp_contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_messages" ON whatsapp_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on whatsapp_crm_relationships" ON whatsapp_crm_relationships FOR ALL USING (true);

-- ✅ BANCO DE DADOS CONFIGURADO COM SUCESSO! 