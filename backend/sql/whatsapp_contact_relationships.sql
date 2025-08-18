-- Tabela de relacionamentos entre contatos do WhatsApp e dados do CRM
CREATE TABLE IF NOT EXISTS whatsapp_contact_relationships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Identificação da instância e contato
    whatsapp_instance VARCHAR(255) NOT NULL,
    whatsapp_contact_id VARCHAR(255) NOT NULL, -- ID do contato no WhatsApp (ex: 141953131933700@lid)
    
    -- Relacionamentos com CRM
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Dados do pipeline
    pipeline_status VARCHAR(50) DEFAULT 'lead-bruto' CHECK (
        pipeline_status IN (
            'lead-bruto', 'contato-realizado', 'qualificado', 
            'proposta-enviada', 'follow-up', 'fechado-ganho', 
            'fechado-perdido', 'cliente'
        )
    ),
    
    -- Metadados
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    tags TEXT[], -- Array de tags para categorização
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_whatsapp_contact UNIQUE (whatsapp_instance, whatsapp_contact_id),
    CONSTRAINT lead_or_customer_required CHECK (lead_id IS NOT NULL OR customer_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_relationships_instance 
ON whatsapp_contact_relationships(whatsapp_instance);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_relationships_lead 
ON whatsapp_contact_relationships(lead_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_relationships_customer 
ON whatsapp_contact_relationships(customer_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_relationships_pipeline 
ON whatsapp_contact_relationships(pipeline_status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_contact_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_contact_relationships_updated_at
    BEFORE UPDATE ON whatsapp_contact_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_contact_relationships_updated_at();

-- View para facilitar consultas
CREATE OR REPLACE VIEW whatsapp_contacts_with_crm AS
SELECT 
    wcr.id,
    wcr.whatsapp_instance,
    wcr.whatsapp_contact_id,
    wcr.lead_id,
    wcr.customer_id,
    wcr.pipeline_status,
    wcr.priority,
    wcr.notes,
    wcr.tags,
    wcr.created_at,
    wcr.updated_at,
    
    -- Dados do lead
    l.name as lead_name,
    l.email as lead_email,
    l.phone as lead_phone,
    l.campaign as lead_campaign,
    l.status as lead_status,
    
    -- Dados do cliente
    c.name as customer_name,
    c.whatsapp_number as customer_whatsapp,
    c.email as customer_email,
    c.company as customer_company,
    
    -- Dados computados
    COALESCE(l.name, c.name) as display_name,
    CASE 
        WHEN l.id IS NOT NULL THEN 'lead'
        WHEN c.id IS NOT NULL THEN 'customer'
        ELSE 'unknown'
    END as contact_type
FROM whatsapp_contact_relationships wcr
LEFT JOIN leads l ON wcr.lead_id = l.id
LEFT JOIN customers c ON wcr.customer_id = c.id;

-- RLS (Row Level Security) - se necessário
ALTER TABLE whatsapp_contact_relationships ENABLE ROW LEVEL SECURITY;

-- Política básica (ajustar conforme necessário)
CREATE POLICY "Enable read access for all users" ON whatsapp_contact_relationships
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON whatsapp_contact_relationships
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON whatsapp_contact_relationships
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON whatsapp_contact_relationships
    FOR DELETE USING (true); 