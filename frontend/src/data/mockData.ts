// Dados mock para sistema de usuários, projetos e auditoria

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  projectId: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  phone?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  settings: {
    allowInvites: boolean;
    maxMembers: number;
  };
  color: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string;
  message?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Dados mock de usuários
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Rony Peterson',
    email: 'rony@ronypetersonadv.com',
    role: 'owner',
    projectId: 'project-1',
    isActive: true,
    lastLogin: '2024-12-19T10:30:00Z',
    createdAt: '2024-01-15T08:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    phone: '+55 11 99999-9999'
  },
  {
    id: 'user-2',
    name: 'Maria Silva',
    email: 'maria.silva@empresa.com',
    role: 'member',
    projectId: 'project-1',
    isActive: true,
    lastLogin: '2024-12-19T09:15:00Z',
    createdAt: '2024-02-20T10:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    phone: '+55 11 88888-8888'
  },
  {
    id: 'user-3',
    name: 'João Santos',
    email: 'joao.santos@empresa.com',
    role: 'member',
    projectId: 'project-1',
    isActive: true,
    lastLogin: '2024-12-19T08:45:00Z',
    createdAt: '2024-03-10T14:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    phone: '+55 11 77777-7777'
  },
  {
    id: 'user-4',
    name: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    role: 'owner',
    projectId: 'project-2',
    isActive: true,
    lastLogin: '2024-12-18T16:20:00Z',
    createdAt: '2024-04-05T11:15:00Z',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    phone: '+55 11 66666-6666'
  },
  {
    id: 'user-5',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@empresa.com',
    role: 'member',
    projectId: 'project-2',
    isActive: false,
    lastLogin: '2024-12-15T14:10:00Z',
    createdAt: '2024-05-12T09:45:00Z',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    phone: '+55 11 55555-5555'
  }
];

// Dados mock de projetos
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Projeto de Rony Peterson',
    description: 'Sistema de CRM com WhatsApp para atendimento e vendas',
    ownerId: 'user-1',
    members: ['user-1', 'user-2', 'user-3'],
    createdAt: '2024-01-15T08:00:00Z',
    settings: {
      allowInvites: true,
      maxMembers: 10
    },
    color: '#10B981'
  },
  {
    id: 'project-2',
    name: 'Projeto de Ana Costa',
    description: 'Projeto focado em automação e integração de sistemas',
    ownerId: 'user-4',
    members: ['user-4', 'user-5'],
    createdAt: '2024-03-01T10:00:00Z',
    settings: {
      allowInvites: true,
      maxMembers: 5
    },
    color: '#3B82F6'
  }
];

// Dados mock de convites
export const mockProjectInvites: ProjectInvite[] = [
  {
    id: 'invite-1',
    projectId: 'project-1',
    fromUserId: 'user-1',
    fromUserName: 'Rony Peterson',
    toUserId: 'user-6',
    toUserName: 'Pedro Lima',
    status: 'pending',
    createdAt: '2024-12-19T11:00:00Z',
    message: 'Gostaria de participar do seu projeto de CRM!'
  },
  {
    id: 'invite-2',
    projectId: 'project-2',
    fromUserId: 'user-4',
    fromUserName: 'Ana Costa',
    toUserId: 'user-7',
    toUserName: 'Sofia Martins',
    status: 'pending',
    createdAt: '2024-12-19T10:30:00Z',
    message: 'Convidei você para participar do nosso projeto de automação.'
  },
  {
    id: 'invite-3',
    projectId: 'project-1',
    fromUserId: 'user-1',
    fromUserName: 'Rony Peterson',
    toUserId: 'user-8',
    toUserName: 'Lucas Ferreira',
    status: 'approved',
    createdAt: '2024-12-18T14:20:00Z',
    respondedAt: '2024-12-18T15:30:00Z',
    message: 'Bem-vindo ao projeto!'
  },
  {
    id: 'invite-4',
    projectId: 'project-2',
    fromUserId: 'user-4',
    fromUserName: 'Ana Costa',
    toUserId: 'user-9',
    toUserName: 'Camila Santos',
    status: 'rejected',
    createdAt: '2024-12-17T16:45:00Z',
    respondedAt: '2024-12-17T17:00:00Z',
    message: 'Obrigada pelo convite, mas não posso participar no momento.'
  }
];

// Dados mock de auditoria
export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    userId: 'user-1',
    userName: 'Rony Peterson',
    action: 'created',
    entityType: 'lead',
    entityId: 'lead-123',
    entityName: 'João Silva - Lead Qualificado',
    details: { status: 'qualificado', source: 'whatsapp' },
    timestamp: '2024-12-19T10:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-2',
    userId: 'user-2',
    userName: 'Maria Silva',
    action: 'updated',
    entityType: 'lead',
    entityId: 'lead-123',
    entityName: 'João Silva - Lead Qualificado',
    details: { status: 'proposta-enviada', notes: 'Proposta enviada por email' },
    timestamp: '2024-12-19T10:25:00Z',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-3',
    userId: 'user-1',
    userName: 'Rony Peterson',
    action: 'created',
    entityType: 'task',
    entityId: 'task-456',
    entityName: 'Follow-up com cliente',
    details: { priority: 'high', dueDate: '2024-12-20T14:00:00Z' },
    timestamp: '2024-12-19T10:20:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-4',
    userId: 'user-3',
    userName: 'João Santos',
    action: 'completed',
    entityType: 'task',
    entityId: 'task-456',
    entityName: 'Follow-up com cliente',
    details: { completedAt: '2024-12-19T14:30:00Z', notes: 'Cliente confirmou interesse' },
    timestamp: '2024-12-19T14:30:00Z',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-5',
    userId: 'user-2',
    userName: 'Maria Silva',
    action: 'sent',
    entityType: 'message',
    entityId: 'msg-789',
    entityName: 'Mensagem WhatsApp',
    details: { recipient: '+5511999999999', content: 'Olá! Como posso ajudar?' },
    timestamp: '2024-12-19T09:45:00Z',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-6',
    userId: 'user-1',
    userName: 'Rony Peterson',
    action: 'created',
    entityType: 'project',
    entityId: 'project-2',
    entityName: 'Projeto Beta',
    details: { description: 'Projeto de testes e desenvolvimento' },
    timestamp: '2024-12-19T08:15:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-7',
    userId: 'user-4',
    userName: 'Ana Costa',
    action: 'logged_in',
    entityType: 'user',
    entityId: 'user-4',
    entityName: 'Ana Costa',
    details: { loginMethod: 'email', sessionDuration: '2h 30m' },
    timestamp: '2024-12-18T16:20:00Z',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: 'audit-8',
    userId: 'user-1',
    userName: 'Rony Peterson',
    action: 'updated',
    entityType: 'user',
    entityId: 'user-5',
    entityName: 'Carlos Oliveira',
    details: { status: 'inactive', reason: 'Desativado por inatividade' },
    timestamp: '2024-12-15T14:10:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
];

// Funções auxiliares para trabalhar com os dados
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getProjectById = (id: string): Project | undefined => {
  return mockProjects.find(project => project.id === id);
};

export const getUsersByProject = (projectId: string): User[] => {
  return mockUsers.filter(user => user.projectId === projectId);
};

export const getAuditLogsByUser = (userId: string): AuditLog[] => {
  return mockAuditLogs.filter(log => log.userId === userId);
};

export const getAuditLogsByProject = (projectId: string): AuditLog[] => {
  const project = getProjectById(projectId);
  if (!project) return [];
  
  const projectUserIds = project.members;
  return mockAuditLogs.filter(log => projectUserIds.includes(log.userId));
};

export const getRecentAuditLogs = (limit: number = 10): AuditLog[] => {
  return mockAuditLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};
