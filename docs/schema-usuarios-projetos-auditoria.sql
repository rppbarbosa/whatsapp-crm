-- =====================================================
-- SCHEMA COMPLETO - SISTEMA DE USUÁRIOS, PROJETOS E AUDITORIA
-- WhatsApp CRM - Sistema de Gerenciamento
-- =====================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE USUÁRIOS (Extensão do auth.users do Supabase)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    project_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA DE PROJETOS
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
-- 3. TABELA DE CONVITES DE PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Garantir que não há convites duplicados pendentes
    UNIQUE(project_id, from_user_id, to_user_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 4. TABELA DE LOGS DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ADICIONAR FOREIGN KEY PARA project_id APÓS CRIAR TABELA projects
-- =====================================================

ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_project_id ON public.profiles(project_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

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
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

-- =====================================================
-- 6. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualizar updated_at em profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FUNÇÕES AUXILIARES
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
-- 8. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Project members can view other members" ON public.profiles
    FOR SELECT USING (
        project_id IS NOT NULL AND 
        project_id IN (
            SELECT project_id FROM public.profiles 
            WHERE id = auth.uid() AND project_id IS NOT NULL
        )
    );

-- Políticas para projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Project members can view project details" ON public.projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM public.profiles 
            WHERE id = auth.uid() AND project_id IS NOT NULL
        )
    );

CREATE POLICY "Project owners can update projects" ON public.projects
    FOR UPDATE USING (owner_id = auth.uid());

-- Políticas para project_invites
CREATE POLICY "Users can view invites they sent or received" ON public.project_invites
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create invites" ON public.project_invites
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update invites they received" ON public.project_invites
    FOR UPDATE USING (to_user_id = auth.uid());

-- Políticas para audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

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
    p.name as user_name,
    p.email as user_email
FROM public.audit_logs al
JOIN public.profiles p ON p.id = al.user_id;

-- =====================================================
-- 10. DADOS INICIAIS (SEED DATA)
-- =====================================================

-- Inserir usuário administrador padrão (após criação do usuário no auth)
-- Este será executado via trigger ou função de setup

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.profiles IS 'Perfis de usuários estendendo auth.users do Supabase';
COMMENT ON TABLE public.projects IS 'Projetos do sistema - cada usuário pode ter apenas um projeto';
COMMENT ON TABLE public.project_invites IS 'Convites para participação em projetos';
COMMENT ON TABLE public.audit_logs IS 'Log de auditoria de todas as ações do sistema';

COMMENT ON COLUMN public.profiles.project_id IS 'ID do projeto ao qual o usuário pertence (NULL se não estiver em nenhum projeto)';
COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário: owner (proprietário do projeto) ou member (membro)';
COMMENT ON COLUMN public.projects.settings IS 'Configurações do projeto em formato JSON';
COMMENT ON COLUMN public.project_invites.status IS 'Status do convite: pending, approved, rejected';
COMMENT ON COLUMN public.audit_logs.details IS 'Detalhes adicionais da ação em formato JSON';

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
