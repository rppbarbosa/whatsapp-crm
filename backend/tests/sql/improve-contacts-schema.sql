-- ===== MELHORIAS NA TABELA DE CONTATOS =====
-- Execute este SQL no Supabase SQL Editor para adicionar colunas necessárias

-- 1. Adicionar colunas para dados mais completos dos contatos
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS push_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_profile JSONB,
ADD COLUMN IF NOT EXISTS verified_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_enterprise BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_high_level_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_me BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_wid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS labels TEXT[],
ADD COLUMN IF NOT EXISTS formatted_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS short_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS notify_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS verified_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_announce_group BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_group_v2 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_group_v2_sub BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_linked_carousel_ephemeral BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_my_contact BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_pin_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_psa BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_user_facing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_wa_contact BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_wid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lid TEXT,
ADD COLUMN IF NOT EXISTS server TEXT,
ADD COLUMN IF NOT EXISTS signal_bio VARCHAR(500),
ADD COLUMN IF NOT EXISTS signal_bio_emoji VARCHAR(50),
ADD COLUMN IF NOT EXISTS status_psid TEXT,
ADD COLUMN IF NOT EXISTS threat_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_biz_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS wid TEXT;

-- 2. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_display_name ON whatsapp_contacts(display_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_business ON whatsapp_contacts(is_business);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_verified ON whatsapp_contacts(is_verified);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_labels ON whatsapp_contacts USING GIN(labels);

-- 3. Função para atualizar dados dos contatos
CREATE OR REPLACE FUNCTION update_contact_display_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não tem display_name, usar name ou phone
    IF NEW.display_name IS NULL THEN
        NEW.display_name = COALESCE(NEW.name, NEW.phone);
    END IF;
    
    -- Se não tem formatted_name, usar display_name
    IF NEW.formatted_name IS NULL THEN
        NEW.formatted_name = NEW.display_name;
    END IF;
    
    -- Se não tem short_name, usar primeira palavra do display_name
    IF NEW.short_name IS NULL AND NEW.display_name IS NOT NULL THEN
        NEW.short_name = split_part(NEW.display_name, ' ', 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para atualizar automaticamente
DROP TRIGGER IF EXISTS update_contact_display_info_trigger ON whatsapp_contacts;
CREATE TRIGGER update_contact_display_info_trigger
    BEFORE INSERT OR UPDATE ON whatsapp_contacts
    FOR EACH ROW EXECUTE FUNCTION update_contact_display_info();

-- 5. View para contatos com dados completos
CREATE OR REPLACE VIEW whatsapp_contacts_complete AS
SELECT 
    id,
    COALESCE(display_name, name, phone) as display_name,
    COALESCE(formatted_name, display_name, name, phone) as formatted_name,
    COALESCE(short_name, split_part(COALESCE(display_name, name, phone), ' ', 1)) as short_name,
    phone,
    profile_pic_url,
    status,
    is_group,
    is_business,
    is_verified,
    is_wa_contact,
    has_messages,
    instance_name,
    created_at,
    updated_at
FROM whatsapp_contacts;

-- 6. Comentários para documentação
COMMENT ON COLUMN whatsapp_contacts.display_name IS 'Nome de exibição do contato (pode ser diferente do nome salvo)';
COMMENT ON COLUMN whatsapp_contacts.push_name IS 'Nome usado para notificações push';
COMMENT ON COLUMN whatsapp_contacts.business_profile IS 'Dados do perfil de negócio (JSON)';
COMMENT ON COLUMN whatsapp_contacts.verified_name IS 'Nome verificado do contato';
COMMENT ON COLUMN whatsapp_contacts.is_business IS 'Se é um contato de negócio';
COMMENT ON COLUMN whatsapp_contacts.is_verified IS 'Se o contato é verificado';
COMMENT ON COLUMN whatsapp_contacts.labels IS 'Array de labels/tags do contato';
COMMENT ON COLUMN whatsapp_contacts.formatted_name IS 'Nome formatado para exibição';
COMMENT ON COLUMN whatsapp_contacts.short_name IS 'Nome curto (primeira palavra)';

-- 7. Atualizar contatos existentes
UPDATE whatsapp_contacts 
SET 
    display_name = COALESCE(name, phone),
    formatted_name = COALESCE(name, phone),
    short_name = split_part(COALESCE(name, phone), ' ', 1)
WHERE display_name IS NULL;

-- 8. Verificar resultado
SELECT 
    'Contatos atualizados' as status,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN display_name IS NOT NULL THEN 1 END) as with_display_name,
    COUNT(CASE WHEN profile_pic_url IS NOT NULL THEN 1 END) as with_photo,
    COUNT(CASE WHEN is_business = true THEN 1 END) as business_contacts
FROM whatsapp_contacts; 