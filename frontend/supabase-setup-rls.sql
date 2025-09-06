-- Script SQL - Parte 2: Configurar RLS e Políticas
-- Execute APÓS executar o script anterior

-- 1. Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para usuários
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Políticas para instâncias
CREATE POLICY "Users can view own instances" ON public.whatsapp_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instances" ON public.whatsapp_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances" ON public.whatsapp_instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances" ON public.whatsapp_instances
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Políticas para conversas
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

-- 5. Políticas para mensagens
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
