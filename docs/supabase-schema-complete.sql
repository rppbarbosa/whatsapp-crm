-- Schema completo para WhatsApp CRM com Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- ========================================

-- Tabela de usuários (estende a auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE LEADS E PIPELINE
-- ========================================

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source TEXT DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'referral', 'social', 'other')),
  status TEXT DEFAULT 'lead-bruto' CHECK (status IN (
    'lead-bruto', 
    'contato-realizado', 
    'qualificado', 
    'proposta-enviada', 
    'follow-up', 
    'fechado-ganho', 
    'fechado-perdido'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atividades do pipeline
CREATE TABLE IF NOT EXISTS public.pipeline_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'proposal', 'follow_up', 'status_change', 'note'
  )),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE CLIENTES E CONTATOS
-- ========================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  whatsapp_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'customer')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE CONVERSAS E MENSAGENS
-- ========================================

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  whatsapp_instance TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  pipeline_status TEXT DEFAULT 'lead-bruto' CHECK (pipeline_status IN (
    'lead-bruto', 
    'contato-realizado', 
    'qualificado', 
    'proposta-enviada', 
    'follow-up', 
    'fechado-ganho', 
    'fechado-perdido'
  )),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT UNIQUE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'ai')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document')),
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE WHATSAPP
-- ========================================

-- Tabela de instâncias do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  instance_name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting')),
  qr_code TEXT,
  phone_number TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE IA E AUTOMAÇÃO
-- ========================================

-- Tabela de configurações de IA
CREATE TABLE IF NOT EXISTS public.ai_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS public.auto_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_keywords TEXT[],
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABELAS DE LOGS E RELATÓRIOS
-- ========================================

-- Tabela de logs de atividades
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas e relatórios
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  metric_date DATE NOT NULL,
  entity_id UUID,
  entity_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- Índices para pipeline activities
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_lead_id ON public.pipeline_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_user_id ON public.pipeline_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_scheduled_at ON public.pipeline_activities(scheduled_at);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_number ON public.customers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON public.customers(assigned_to);

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_pipeline_status ON public.conversations(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);

-- Índices para whatsapp instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_name ON public.whatsapp_instances(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON public.whatsapp_instances(status);

-- Índices para activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Índices para metrics
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON public.metrics(metric_type, metric_date);
CREATE INDEX IF NOT EXISTS idx_metrics_entity ON public.metrics(entity_type, entity_id);

-- ========================================
-- FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON public.ai_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_responses_updated_at BEFORE UPDATE ON public.auto_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar lead automaticamente quando nova conversa é iniciada
CREATE OR REPLACE FUNCTION create_lead_from_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não há lead associado à conversa, criar um novo
  IF NEW.lead_id IS NULL THEN
    INSERT INTO public.leads (
      name,
      phone,
      status,
      source,
      created_at,
      updated_at
    ) VALUES (
      COALESCE((SELECT name FROM public.customers WHERE id = NEW.customer_id), 'Cliente WhatsApp'),
      NEW.whatsapp_number,
      'lead-bruto',
      'whatsapp',
      NOW(),
      NOW()
    ) RETURNING id INTO NEW.lead_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar lead automaticamente
CREATE TRIGGER create_lead_from_conversation_trigger
  BEFORE INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_from_conversation();

-- ========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para leads
CREATE POLICY "Authenticated users can manage leads" ON public.leads FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para pipeline activities
CREATE POLICY "Authenticated users can manage pipeline activities" ON public.pipeline_activities FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para customers
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para conversations
CREATE POLICY "Authenticated users can manage conversations" ON public.conversations FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para messages
CREATE POLICY "Authenticated users can manage messages" ON public.messages FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para whatsapp instances
CREATE POLICY "Authenticated users can manage whatsapp instances" ON public.whatsapp_instances FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para ai configs
CREATE POLICY "Authenticated users can manage ai configs" ON public.ai_configs FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para auto responses
CREATE POLICY "Authenticated users can manage auto responses" ON public.auto_responses FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para activity logs
CREATE POLICY "Authenticated users can view activity logs" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- Políticas para metrics
CREATE POLICY "Authenticated users can view metrics" ON public.metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert metrics" ON public.metrics FOR INSERT WITH CHECK (true);

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Inserir configuração padrão de IA
INSERT INTO public.ai_configs (name, prompt_template) VALUES (
  'Resposta Padrão',
  'Você é um assistente de vendas profissional e amigável. Responda de forma educada e objetiva, sempre focando em ajudar o cliente. Limite sua resposta a 150 caracteres. Contexto da empresa: Empresa de produtos e serviços. Regras: Seja sempre educado e profissional, foque em resolver a dúvida do cliente, ofereça ajuda adicional quando apropriado, use emojis moderadamente.'
) ON CONFLICT DO NOTHING;

-- Inserir respostas automáticas padrão
INSERT INTO public.auto_responses (name, trigger_keywords, response_text) VALUES 
  ('Saudação', ARRAY['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'], 'Olá! Como posso ajudar você hoje? 😊'),
  ('Preços', ARRAY['preço', 'valor', 'quanto custa', 'custo'], 'Gostaria de saber mais sobre nossos preços? Posso te ajudar com uma proposta personalizada! 💰'),
  ('Horário', ARRAY['horário', 'funcionamento', 'aberto', 'fechado'], 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Como posso te ajudar? ⏰')
ON CONFLICT DO NOTHING;

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- View para dashboard de leads
CREATE OR REPLACE VIEW public.leads_dashboard AS
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM public.leads
GROUP BY status;

-- View para conversas com informações do lead
CREATE OR REPLACE VIEW public.conversations_with_lead AS
SELECT 
  c.*,
  l.name as lead_name,
  l.email as lead_email,
  l.phone as lead_phone,
  l.status as lead_status,
  cust.name as customer_name,
  cust.whatsapp_number as customer_whatsapp
FROM public.conversations c
LEFT JOIN public.leads l ON c.lead_id = l.id
LEFT JOIN public.customers cust ON c.customer_id = cust.id;

-- View para métricas de conversão
CREATE OR REPLACE VIEW public.conversion_metrics AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'fechado-ganho' THEN 1 END) as won_leads,
  COUNT(CASE WHEN status = 'fechado-perdido' THEN 1 END) as lost_leads,
  ROUND(
    (COUNT(CASE WHEN status = 'fechado-ganho' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
  ) as conversion_rate
FROM public.leads
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC; 