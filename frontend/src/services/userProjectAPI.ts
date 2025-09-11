import axios from 'axios';

// Configuração base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_KEY = process.env.REACT_APP_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  },
});

// Interceptor para logs
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 UserProject API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ UserProject API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ UserProject API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ UserProject API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tipos TypeScript
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'member';
  is_active: boolean;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  settings: {
    allowInvites: boolean;
    maxMembers: number;
  };
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  created_at: string;
  updated_at: string;
  // Campos da view
  project_name?: string;
  inviter_name?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Campos da view
  user_name?: string;
  user_email?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  pendingInvites: number;
}

// API de Usuários
export const userAPI = {
  // Obter perfil do usuário
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  // Atualizar perfil do usuário
  updateProfile: async (profile: Partial<User>): Promise<User> => {
    const response = await api.put('/api/users/profile', profile);
    return response.data;
  },

  // Obter estatísticas do usuário
  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/api/users/stats');
    return response.data;
  },
};

// API de Projetos
export const projectAPI = {
  // Criar projeto
  create: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    const response = await api.post('/api/users/projects', project);
    return response.data;
  },

  // Obter projetos do usuário
  getUserProjects: async (): Promise<Project[]> => {
    const response = await api.get('/api/users/projects');
    return response.data;
  },

  // Atualizar projeto
  update: async (projectId: string, project: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/api/users/projects/${projectId}`, project);
    return response.data;
  },

  // Remover membro do projeto
  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/api/users/projects/${projectId}/members/${userId}`);
  },
};

// API de Convites
export const inviteAPI = {
  // Enviar convite para projeto
  send: async (projectId: string, invite: { invitee_email: string; message?: string }): Promise<ProjectInvite> => {
    const response = await api.post(`/api/users/projects/${projectId}/invite`, invite);
    return response.data;
  },

  // Obter convites recebidos
  getReceived: async (): Promise<ProjectInvite[]> => {
    const response = await api.get('/api/users/invites/received');
    return response.data;
  },

  // Obter convites enviados
  getSent: async (): Promise<ProjectInvite[]> => {
    const response = await api.get('/api/users/invites/sent');
    return response.data;
  },

  // Aprovar convite
  approve: async (inviteId: string): Promise<ProjectInvite> => {
    const response = await api.put(`/api/users/invites/${inviteId}/approve`);
    return response.data;
  },

  // Rejeitar convite
  reject: async (inviteId: string): Promise<ProjectInvite> => {
    const response = await api.put(`/api/users/invites/${inviteId}/reject`);
    return response.data;
  },
};

// API de Auditoria
export const auditAPI = {
  // Obter logs de auditoria
  getLogs: async (filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/api/users/audit-logs?${params.toString()}`);
    return response.data;
  },
};

export default api;
