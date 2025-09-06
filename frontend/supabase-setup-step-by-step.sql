-- Script SQL - PASSO A PASSO
-- Execute cada parte separadamente

-- PASSO 1: Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 2: Criar tabela de instâncias (execute APÓS o passo 1)
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

-- PASSO 3: Criar tabela de conversas (execute APÓS o passo 2)
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

-- PASSO 4: Criar tabela de mensagens (execute APÓS o passo 3)
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
