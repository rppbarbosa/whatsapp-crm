export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  online: boolean;
  conversationId: string;
  instanceName: string;
  hasMessages: boolean;
  lastActivity?: string;
  isGroup: boolean;
  // Novos campos para compatibilidade com ConversationList
  isArchived?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  isBusiness?: boolean;
  memberCount?: number;
}

export interface WhatsAppMessage {
  id: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  mediaDuration?: number;
}

// Dados mockados para demonstração
export const MOCK_CONTACTS: WhatsAppContact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '+55 11 99999-9999',
    avatar: 'JS',
    lastMessage: 'Olá! Como você está?',
    timestamp: '14:30',
    unreadCount: 2,
    online: true,
    conversationId: 'conv_1',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T14:30:00Z',
    isGroup: false,
    isArchived: false,
    isPinned: true, // Fixado
    isMuted: false,
    isBlocked: false,
    isFavorite: true, // Favorito
    isBookmarked: false,
    isBusiness: false,
    memberCount: undefined
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '+55 11 88888-8888',
    avatar: 'MS',
    lastMessage: 'Obrigada pela informação!',
    timestamp: '13:45',
    unreadCount: 0,
    online: false,
    conversationId: 'conv_2',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T13:45:00Z',
    isGroup: false,
    isArchived: false,
    isPinned: false,
    isMuted: true, // Silenciado
    isBlocked: false,
    isFavorite: false,
    isBookmarked: false,
    isBusiness: true, // Business
    memberCount: undefined
  },
  {
    id: '3',
    name: 'Grupo Família',
    phone: 'familia@g.us',
    avatar: '👨‍👩‍👧‍👦',
    lastMessage: 'Pedro: Boa noite a todos!',
    timestamp: '12:20',
    unreadCount: 5,
    online: false,
    conversationId: 'conv_3',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T12:20:00Z',
    isGroup: true,
    isArchived: false,
    isPinned: true, // Fixado
    isMuted: false,
    isBlocked: false,
    isFavorite: true, // Favorito
    isBookmarked: false,
    isBusiness: false,
    memberCount: 12
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    phone: '+55 11 77777-7777',
    avatar: 'CO',
    lastMessage: 'Vou verificar e te retorno',
    timestamp: '11:15',
    unreadCount: 0,
    online: true,
    conversationId: 'conv_4',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T11:15:00Z',
    isGroup: false,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    isBlocked: false,
    isFavorite: false,
    isBookmarked: false,
    isBusiness: false,
    memberCount: undefined
  },
  {
    id: '5',
    name: 'Ana Costa',
    phone: '+55 11 66666-6666',
    avatar: 'AC',
    lastMessage: 'Perfeito! Até amanhã',
    timestamp: '10:30',
    unreadCount: 0,
    online: false,
    conversationId: 'conv_5',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T10:30:00Z',
    isGroup: false,
    isArchived: true, // Arquivado
    isPinned: false,
    isMuted: false,
    isBlocked: false,
    isFavorite: false,
    isBookmarked: false,
    isBusiness: false,
    memberCount: undefined
  },
  {
    id: '6',
    name: 'Grupo Trabalho',
    phone: 'trabalho@g.us',
    avatar: '💼',
    lastMessage: 'Ana: Reunião amanhã às 9h',
    timestamp: '09:45',
    unreadCount: 3,
    online: false,
    conversationId: 'conv_6',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T09:45:00Z',
    isGroup: true,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    isBlocked: false,
    isFavorite: false,
    isBookmarked: false,
    isBusiness: false,
    memberCount: 8
  },
  {
    id: '7',
    name: 'Pedro Almeida',
    phone: '+55 11 55555-5555',
    avatar: 'PA',
    lastMessage: 'Valeu! Abraço',
    timestamp: '08:30',
    unreadCount: 0,
    online: false,
    conversationId: 'conv_7',
    instanceName: 'whatsapp-crm-instance',
    hasMessages: true,
    lastActivity: '2024-01-15T08:30:00Z',
    isGroup: false,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    isBlocked: true, // Bloqueado
    isFavorite: false,
    isBookmarked: false,
    isBusiness: false,
    memberCount: undefined
  }
];

export const MOCK_MESSAGES: WhatsAppMessage[] = [
  {
    id: '1',
    text: 'Olá! Como você está?',
    timestamp: '14:30',
    isFromMe: false,
    status: 'read'
  },
  {
    id: '2',
    text: 'Oi! Tudo bem, obrigado! E você?',
    timestamp: '14:32',
    isFromMe: true,
    status: 'read'
  },
  {
    id: '3',
    text: 'Também estou bem! Preciso de uma informação sobre o projeto',
    timestamp: '14:33',
    isFromMe: false,
    status: 'read'
  },
  {
    id: '4',
    text: 'Claro! Pode me falar qual é a dúvida?',
    timestamp: '14:35',
    isFromMe: true,
    status: 'delivered'
  },
  {
    id: '5',
    text: 'Queria saber se já temos uma data definida para a entrega',
    timestamp: '14:36',
    isFromMe: false,
    status: 'read'
  }
];

// Função para gerar mensagens aleatórias para outros contatos
export const generateRandomMessages = (contactId: string): WhatsAppMessage[] => {
  const messages = [
    'Oi! Tudo bem?',
    'Como vai?',
    'Preciso de uma informação',
    'Obrigada!',
    'Até logo!',
    'Boa tarde!',
    'Bom dia!',
    'Boa noite!',
    'Valeu!',
    'Perfeito!'
  ];

  const randomCount = Math.floor(Math.random() * 5) + 1;
  const result: WhatsAppMessage[] = [];

  for (let i = 0; i < randomCount; i++) {
    const isFromMe = Math.random() > 0.5;
    const message: WhatsAppMessage = {
      id: `${contactId}_msg_${i}`,
      text: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isFromMe,
      status: isFromMe ? 'read' : 'delivered'
    };
    result.push(message);
  }

  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};
