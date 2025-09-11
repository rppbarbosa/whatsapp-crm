import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userAPI, projectAPI, inviteAPI, auditAPI, User, Project, ProjectInvite, AuditLog, UserStats } from '../services/userProjectAPI';

interface UserProjectContextType {
  // Estado
  users: User[];
  projects: Project[];
  invites: ProjectInvite[];
  auditLogs: AuditLog[];
  currentUser: User | null;
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;

  // Ações de usuários
  loadUsers: () => Promise<void>;
  updateUser: (userId: string, user: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  // Ações de projetos
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (projectId: string, project: Partial<Project>) => Promise<void>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;

  // Ações de convites
  loadInvites: () => Promise<void>;
  sendInvite: (projectId: string, invite: { invitee_email: string; message?: string }) => Promise<void>;
  approveInvite: (inviteId: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;

  // Ações de auditoria
  loadAuditLogs: (filters?: any) => Promise<void>;

  // Ações de perfil
  loadCurrentUser: () => Promise<void>;
  updateCurrentUser: (user: Partial<User>) => Promise<void>;

  // Utilitários
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

const UserProjectContext = createContext<UserProjectContextType | undefined>(undefined);

interface UserProjectProviderProps {
  children: ReactNode;
}

export const UserProjectProvider: React.FC<UserProjectProviderProps> = ({ children }) => {
  // Estado
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para lidar com erros
  const handleError = (error: any, action: string) => {
    console.error(`Erro em ${action}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Erro ao ${action}`;
    setError(errorMessage);
  };

  // Função para limpar erro
  const clearError = () => setError(null);

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const usersData = await userAPI.getProfile();
      // Por enquanto, vamos simular uma lista de usuários
      // Em uma implementação real, teríamos uma API para listar usuários do projeto
      const mockUsers: User[] = [
        {
          id: usersData.id,
          full_name: usersData.full_name,
          email: usersData.email,
          phone: usersData.phone || '',
          role: usersData.role,
          is_active: usersData.is_active,
          project_id: usersData.project_id,
          created_at: usersData.created_at,
          updated_at: usersData.updated_at,
        }
      ];
      setUsers(Array.isArray(mockUsers) ? mockUsers : []);
    } catch (error) {
      handleError(error, 'carregar usuários');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar usuário
  const updateUser = async (userId: string, user: Partial<User>) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      await userAPI.updateProfile(user);
      // Atualizar estado local
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...user } : u));
    } catch (error) {
      handleError(error, 'atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar usuário
  const deleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      clearError();
      // Simular exclusão
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      handleError(error, 'deletar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar projetos
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const response = await projectAPI.getUserProjects();
      console.log('🔍 Debug loadProjects response:', response);
      
      // A API retorna { success: true, data: [...] }
      const projectsData = (response as any).data || response;
      console.log('🔍 Debug projectsData:', projectsData);
      
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      handleError(error, 'carregar projetos');
      // Garantir que projects seja sempre um array
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Criar projeto
  const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const newProject = await projectAPI.create(project);
      setProjects(prev => [...prev, newProject]);
    } catch (error) {
      handleError(error, 'criar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar projeto
  const updateProject = async (projectId: string, project: Partial<Project>) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const updatedProject = await projectAPI.update(projectId, project);
      setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    } catch (error) {
      handleError(error, 'atualizar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  // Remover membro do projeto
  const removeProjectMember = async (projectId: string, userId: string) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      await projectAPI.removeMember(projectId, userId);
      // Atualizar estado local
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, project_id: undefined } : u));
    } catch (error) {
      handleError(error, 'remover membro do projeto');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar convites
  const loadInvites = async () => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const [receivedInvites, sentInvites] = await Promise.all([
        inviteAPI.getReceived(),
        inviteAPI.getSent()
      ]);
      const allInvites = [
        ...(Array.isArray(receivedInvites) ? receivedInvites : []),
        ...(Array.isArray(sentInvites) ? sentInvites : [])
      ];
      setInvites(allInvites);
    } catch (error) {
      handleError(error, 'carregar convites');
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar convite
  const sendInvite = async (projectId: string, invite: { invitee_email: string; message?: string }) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const newInvite = await inviteAPI.send(projectId, invite);
      setInvites(prev => [...prev, newInvite]);
    } catch (error) {
      handleError(error, 'enviar convite');
    } finally {
      setIsLoading(false);
    }
  };

  // Aprovar convite
  const approveInvite = async (inviteId: string) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const updatedInvite = await inviteAPI.approve(inviteId);
      setInvites(prev => prev.map(i => i.id === inviteId ? updatedInvite : i));
    } catch (error) {
      handleError(error, 'aprovar convite');
    } finally {
      setIsLoading(false);
    }
  };

  // Rejeitar convite
  const rejectInvite = async (inviteId: string) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const updatedInvite = await inviteAPI.reject(inviteId);
      setInvites(prev => prev.map(i => i.id === inviteId ? updatedInvite : i));
    } catch (error) {
      handleError(error, 'rejeitar convite');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar logs de auditoria
  const loadAuditLogs = async (filters?: any) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const logsData = await auditAPI.getLogs(filters);
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      handleError(error, 'carregar logs de auditoria');
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuário atual
  const loadCurrentUser = async () => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const response = await userAPI.getProfile();
      console.log('🔍 Debug loadCurrentUser response:', response);
      
      // A API retorna { success: true, data: {...} }
      const userData = (response as any).data || response;
      console.log('🔍 Debug userData completo:', JSON.stringify(userData, null, 2));
      
      setCurrentUser(userData);
    } catch (error) {
      handleError(error, 'carregar usuário atual');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar usuário atual
  const updateCurrentUser = async (user: Partial<User>) => {
    try {
      setIsLoading(true);
      clearError();
      // Usar API real do backend
      const updatedUser = await userAPI.updateProfile(user);
      setCurrentUser(updatedUser);
    } catch (error) {
      handleError(error, 'atualizar usuário atual');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar tudo
  const refreshAll = async () => {
    try {
      setIsLoading(true);
      clearError();
      await Promise.all([
        loadUsers(),
        loadProjects(),
        loadInvites(),
        loadAuditLogs(),
        loadCurrentUser(),
      ]);
    } catch (error) {
      handleError(error, 'atualizar dados');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    refreshAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: UserProjectContextType = {
    // Estado
    users,
    projects,
    invites,
    auditLogs,
    currentUser,
    userStats,
    isLoading,
    error,

    // Ações de usuários
    loadUsers,
    updateUser,
    deleteUser,

    // Ações de projetos
    loadProjects,
    createProject,
    updateProject,
    removeProjectMember,

    // Ações de convites
    loadInvites,
    sendInvite,
    approveInvite,
    rejectInvite,

    // Ações de auditoria
    loadAuditLogs,

    // Ações de perfil
    loadCurrentUser,
    updateCurrentUser,

    // Utilitários
    clearError,
    refreshAll,
  };

  return (
    <UserProjectContext.Provider value={value}>
      {children}
    </UserProjectContext.Provider>
  );
};

export const useUserProject = (): UserProjectContextType => {
  const context = useContext(UserProjectContext);
  if (context === undefined) {
    throw new Error('useUserProject deve ser usado dentro de um UserProjectProvider');
  }
  return context;
};
