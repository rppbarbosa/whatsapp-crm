-- =====================================================
-- SCHEMA DE INTEGRAÇÃO SEGURO - USUÁRIOS, PROJETOS E AUDITORIA
-- Integração com schema existente do WhatsApp CRM
-- Verifica se elementos já existem antes de criar
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR TABELA PROFILES EXISTENTE
-- =====================================================

-- Adicionar colunas necessárias para o sistema de projetos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS project_id UUID,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Atualizar constraint de role para incluir owner e member
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'user'::text, 'manager'::text, 'owner'::text, 'member'::text]));

-- =====================================================
-- 2. CRIAR TABELA DE PROJETOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "allowInvites": true,
        "maxMembers": 10
    }'::jsonb,
    color TEXT DEFAULT '#10B981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ADICIONAR FOREIGN KEY PARA project_id
-- =====================================================

-- Verificar se a constraint já existe antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_profiles_project_id' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_project_id 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 4. CRIAR TABELA DE CONVITES DE PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. RENOMEAR TABELA DE AUDITORIA EXISTENTE
-- =====================================================

-- Renomear activity_logs para audit_logs se ainda não foi renomeado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        ALTER TABLE public.activity_logs RENAME TO audit_logs;
    END IF;
END $$;

-- Adicionar colunas necessárias para auditoria completa
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS entity_name TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_project_id ON public.profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);

-- Índices para project_invites
CREATE INDEX IF NOT EXISTS idx_project_invites_project_id ON public.project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_from_user_id ON public.project_invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_to_user_id ON public.project_invites(to_user_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_status ON public.project_invites(status);
CREATE INDEX IF NOT EXISTS idx_project_invites_created_at ON public.project_invites(created_at);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para profiles (verificar se já existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_profiles_updated_at' 
        AND event_object_table = 'profiles'
    ) THEN
        CREATE TRIGGER update_profiles_updated_at 
        BEFORE UPDATE ON public.profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Trigger para projects (verificar se já existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_projects_updated_at' 
        AND event_object_table = 'projects'
    ) THEN
        CREATE TRIGGER update_projects_updated_at 
        BEFORE UPDATE ON public.projects 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 8. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles (verificar se já existem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view own profile' 
        AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update own profile' 
        AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Project members can view other members' 
        AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Project members can view other members" ON public.profiles
        FOR SELECT USING (
            project_id IS NOT NULL AND 
            project_id IN (
                SELECT project_id FROM public.profiles 
                WHERE id = auth.uid() AND project_id IS NOT NULL
            )
        );
    END IF;
END $$;

-- Políticas para projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view own projects' 
        AND tablename = 'projects'
    ) THEN
        CREATE POLICY "Users can view own projects" ON public.projects
        FOR SELECT USING (owner_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Project members can view project details' 
        AND tablename = 'projects'
    ) THEN
        CREATE POLICY "Project members can view project details" ON public.projects
        FOR SELECT USING (
            id IN (
                SELECT project_id FROM public.profiles 
                WHERE id = auth.uid() AND project_id IS NOT NULL
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Project owners can update projects' 
        AND tablename = 'projects'
    ) THEN
        CREATE POLICY "Project owners can update projects" ON public.projects
        FOR UPDATE USING (owner_id = auth.uid());
    END IF;
END $$;

-- Políticas para project_invites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view invites they sent or received' 
        AND tablename = 'project_invites'
    ) THEN
        CREATE POLICY "Users can view invites they sent or received" ON public.project_invites
        FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can create invites' 
        AND tablename = 'project_invites'
    ) THEN
        CREATE POLICY "Users can create invites" ON public.project_invites
        FOR INSERT WITH CHECK (from_user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can update invites they received' 
        AND tablename = 'project_invites'
    ) THEN
        CREATE POLICY "Users can update invites they received" ON public.project_invites
        FOR UPDATE USING (to_user_id = auth.uid());
    END IF;
END $$;

-- Políticas para audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can view own audit logs' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE POLICY "Users can view own audit logs" ON public.audit_logs
        FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Project members can view project audit logs' 
        AND tablename = 'audit_logs'
    ) THEN
        CREATE POLICY "Project members can view project audit logs" ON public.audit_logs
        FOR SELECT USING (
            user_id IN (
                SELECT id FROM public.profiles 
                WHERE project_id IN (
                    SELECT project_id FROM public.profiles 
                    WHERE id = auth.uid() AND project_id IS NOT NULL
                )
            )
        );
    END IF;
END $$;

-- =====================================================
-- 9. VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas de projetos
CREATE OR REPLACE VIEW public.project_stats AS
SELECT 
    p.id,
    p.name,
    p.owner_id,
    p.created_at,
    COUNT(pr.id) as member_count,
    COUNT(CASE WHEN pi.status = 'pending' THEN 1 END) as pending_invites,
    (p.settings->>'maxMembers')::INTEGER as max_members
FROM public.projects p
LEFT JOIN public.profiles pr ON pr.project_id = p.id
LEFT JOIN public.project_invites pi ON pi.project_id = p.id
GROUP BY p.id, p.name, p.owner_id, p.created_at, p.settings;

-- View para histórico de auditoria com detalhes do usuário
CREATE OR REPLACE VIEW public.audit_logs_detailed AS
SELECT 
    al.*,
    p.full_name as user_name,
    p.email as user_email
FROM public.audit_logs al
JOIN public.profiles p ON p.id = al.user_id;

-- =====================================================
-- 10. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário pode participar de projeto
CREATE OR REPLACE FUNCTION can_user_join_project(
    p_user_id UUID,
    p_project_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    user_current_project UUID;
    project_owner_id UUID;
    project_max_members INTEGER;
    current_member_count INTEGER;
BEGIN
    -- Verificar se usuário já está em um projeto
    SELECT project_id INTO user_current_project
    FROM public.profiles
    WHERE id = p_user_id AND project_id IS NOT NULL;
    
    IF user_current_project IS NOT NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se projeto existe e obter configurações
    SELECT owner_id, (settings->>'maxMembers')::INTEGER INTO project_owner_id, project_max_members
    FROM public.projects
    WHERE id = p_project_id;
    
    IF project_owner_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se projeto permite convites
    IF NOT (SELECT (settings->>'allowInvites')::BOOLEAN FROM public.projects WHERE id = p_project_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar limite de membros
    SELECT COUNT(*) INTO current_member_count
    FROM public.profiles
    WHERE project_id = p_project_id;
    
    IF current_member_count >= project_max_members THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para aprovar convite e transferir usuário
CREATE OR REPLACE FUNCTION approve_project_invite(
    p_invite_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    invite_record RECORD;
    old_project_id UUID;
BEGIN
    -- Buscar dados do convite
    SELECT * INTO invite_record
    FROM public.project_invites
    WHERE id = p_invite_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se usuário pode participar
    IF NOT can_user_join_project(invite_record.to_user_id, invite_record.project_id) THEN
        RETURN FALSE;
    END IF;
    
    -- Obter projeto atual do usuário (se houver)
    SELECT project_id INTO old_project_id
    FROM public.profiles
    WHERE id = invite_record.to_user_id;
    
    -- Remover usuário do projeto anterior (se houver)
    IF old_project_id IS NOT NULL THEN
        UPDATE public.profiles
        SET project_id = NULL
        WHERE id = invite_record.to_user_id;
    END IF;
    
    -- Adicionar usuário ao novo projeto
    UPDATE public.profiles
    SET project_id = invite_record.project_id
    WHERE id = invite_record.to_user_id;
    
    -- Cancelar outros convites pendentes do usuário
    UPDATE public.project_invites
    SET status = 'rejected', responded_at = NOW()
    WHERE from_user_id = invite_record.to_user_id 
      AND status = 'pending' 
      AND id != p_invite_id;
    
    -- Aprovar convite atual
    UPDATE public.project_invites
    SET status = 'approved', responded_at = NOW()
    WHERE id = p_invite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.projects IS 'Projetos do sistema - cada usuário pode ter apenas um projeto';
COMMENT ON TABLE public.project_invites IS 'Convites para participação em projetos';
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria de todas as ações do sistema (renomeado de activity_logs)';

COMMENT ON COLUMN public.profiles.project_id IS 'ID do projeto ao qual o usuário pertence (NULL se não estiver em nenhum projeto)';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do usuário';
COMMENT ON COLUMN public.profiles.is_active IS 'Status ativo/inativo do usuário';
COMMENT ON COLUMN public.profiles.last_login IS 'Data e hora do último login';
COMMENT ON COLUMN public.projects.settings IS 'Configurações do projeto em formato JSON';
COMMENT ON COLUMN public.project_invites.status IS 'Status do convite: pending, approved, rejected';
COMMENT ON COLUMN public.audit_logs.details IS 'Detalhes adicionais da ação em formato JSON';

-- =====================================================
-- FIM DO SCHEMA DE INTEGRAÇÃO SEGURO
-- =====================================================
