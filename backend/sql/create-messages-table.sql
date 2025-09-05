-- Tabela para armazenar mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  instance_name TEXT NOT NULL,
  message_id TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, audio, video, document
  message_content TEXT,
  media_url TEXT,
  media_type TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'received', -- received, sent, delivered, read, failed
  is_from_me BOOLEAN DEFAULT FALSE,
  conversation_id TEXT, -- Para agrupar mensagens da mesma conversa
  metadata JSONB, -- Dados adicionais como reply, forward, etc.
  
  -- Índices para performance
  CONSTRAINT fk_instance_name FOREIGN KEY (instance_name) REFERENCES whatsapp_instances(instance_name) ON DELETE CASCADE
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_messages_instance ON whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_messages_to_number ON whatsapp_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_messages_status ON whatsapp_messages(status);

-- Comentários para documentação
COMMENT ON TABLE whatsapp_messages IS 'Tabela para armazenar todas as mensagens do WhatsApp';
COMMENT ON COLUMN whatsapp_messages.message_id IS 'ID único da mensagem do WhatsApp';
COMMENT ON COLUMN whatsapp_messages.conversation_id IS 'ID da conversa para agrupar mensagens';
COMMENT ON COLUMN whatsapp_messages.metadata IS 'Dados adicionais da mensagem em formato JSON';
