-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS - REMOVER RECURSÃO INFINITA
-- =====================================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Project members can view other members" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can view project details" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view invites they sent or received" ON public.project_invites;
DROP POLICY IF EXISTS "Users can create invites" ON public.project_invites;
DROP POLICY IF EXISTS "Users can update invites they received" ON public.project_invites;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Project members can view project audit logs" ON public.audit_logs;

-- Desabilitar RLS temporariamente para testes
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Criar políticas simples sem recursão
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas simples para profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Políticas simples para projects
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE USING (true);

CREATE POLICY "projects_insert_policy" ON public.projects
    FOR INSERT WITH CHECK (true);

-- Políticas simples para project_invites
CREATE POLICY "project_invites_select_policy" ON public.project_invites
    FOR SELECT USING (true);

CREATE POLICY "project_invites_update_policy" ON public.project_invites
    FOR UPDATE USING (true);

CREATE POLICY "project_invites_insert_policy" ON public.project_invites
    FOR INSERT WITH CHECK (true);

-- Políticas simples para audit_logs
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT USING (true);

CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FIM DA CORREÇÃO
-- =====================================================
