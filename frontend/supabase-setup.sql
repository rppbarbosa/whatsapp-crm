-- Scripts SQL para configurar o Supabase
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Habilitar RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- 2. Criar tabela de usuários personalizada
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de instâncias do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  instance_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('connected', 'disconnected', 'connecting')) DEFAULT 'disconnected',
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de conversas
CREATE TABLE IF NOT EXISTS public.whatsapp_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  chat_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instance_id, chat_id)
);

-- 5. Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.whatsapp_chats(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL,
  is_from_me BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'text',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Políticas de RLS (Row Level Security)

-- Política para usuários: só podem ver/editar seus próprios dados
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para instâncias: só podem ver/editar suas próprias instâncias
CREATE POLICY "Users can view own instances" ON public.whatsapp_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances" ON public.whatsapp_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances" ON public.whatsapp_instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances" ON public.whatsapp_instances
  FOR DELETE USING (auth.uid() = user_id);

-- Política para conversas: só podem ver conversas de suas instâncias
CREATE POLICY "Users can view own chats" ON public.whatsapp_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = whatsapp_chats.instance_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chats" ON public.whatsapp_chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = whatsapp_chats.instance_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chats" ON public.whatsapp_chats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = whatsapp_chats.instance_id 
      AND user_id = auth.uid()
    )
  );

-- Política para mensagens: só podem ver mensagens de suas conversas
CREATE POLICY "Users can view own messages" ON public.whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_chats 
      JOIN public.whatsapp_instances ON whatsapp_chats.instance_id = whatsapp_instances.id
      WHERE whatsapp_chats.id = whatsapp_messages.chat_id 
      AND whatsapp_instances.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_chats 
      JOIN public.whatsapp_instances ON whatsapp_chats.instance_id = whatsapp_instances.id
      WHERE whatsapp_chats.id = whatsapp_messages.chat_id 
      AND whatsapp_instances.user_id = auth.uid()
    )
  );

-- 7. Função para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.whatsapp_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_instances_user_id ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_instance_id ON public.whatsapp_chats(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON public.whatsapp_messages(timestamp);
