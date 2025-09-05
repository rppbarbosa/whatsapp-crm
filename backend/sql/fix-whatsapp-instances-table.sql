-- Script para corrigir a tabela whatsapp_instances
-- Adiciona a coluna qr_code que está faltando

-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whatsapp_instances') THEN
        -- Criar tabela se não existir
        CREATE TABLE whatsapp_instances (
            id SERIAL PRIMARY KEY,
            instance_name VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'disconnected',
            phone VARCHAR(20),
            qr_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Tabela whatsapp_instances criada com sucesso';
    ELSE
        -- Adicionar coluna qr_code se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'qr_code') THEN
            ALTER TABLE whatsapp_instances ADD COLUMN qr_code TEXT;
            RAISE NOTICE 'Coluna qr_code adicionada com sucesso';
        ELSE
            RAISE NOTICE 'Coluna qr_code já existe';
        END IF;
        
        -- Adicionar coluna phone se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'phone') THEN
            ALTER TABLE whatsapp_instances ADD COLUMN phone VARCHAR(20);
            RAISE NOTICE 'Coluna phone adicionada com sucesso';
        ELSE
            RAISE NOTICE 'Coluna phone já existe';
        END IF;
        
        -- Adicionar coluna updated_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'whatsapp_instances' AND column_name = 'updated_at') THEN
            ALTER TABLE whatsapp_instances ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Coluna updated_at adicionada com sucesso';
        ELSE
            RAISE NOTICE 'Coluna updated_at já existe';
        END IF;
    END IF;
END $$;

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_whatsapp_instances_updated_at') THEN
        CREATE TRIGGER update_whatsapp_instances_updated_at
            BEFORE UPDATE ON whatsapp_instances
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_updated_at_column criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger update_updated_at_column já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_instances' 
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_instances FROM whatsapp_instances;
