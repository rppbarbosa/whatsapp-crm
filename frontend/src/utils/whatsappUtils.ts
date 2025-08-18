// ===== UTILITÁRIOS PARA PROCESSAMENTO DE DADOS DO WHATSAPP =====

export interface WhatsAppContact {
  id: string;
  phone: string;
  original_id?: string;
  id_type?: 'contact' | 'group' | 'unknown';
  is_group?: boolean;
  name?: string;
  display_name?: string;
  profile_pic_url?: string;
  status?: string;
  last_seen?: string;
  is_wa_contact?: boolean;
  is_business?: boolean;
  is_verified?: boolean;
  has_messages?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessedContact {
  id: string;
  displayName: string;
  displayPhone: string;
  avatarUrl?: string;
  isGroup: boolean;
  isBusiness: boolean;
  isVerified: boolean;
  status?: string;
  lastSeen?: string;
  hasMessages: boolean;
  // Dados originais para referência
  originalData: WhatsAppContact;
}

/**
 * Processa um contato do WhatsApp para exibição no frontend
 */
export function processContactForDisplay(contact: WhatsAppContact): ProcessedContact {
  const isGroup = contact.is_group || contact.id_type === 'group';
  
  // Determinar nome de exibição
  let displayName = contact.display_name || contact.name || 'Contato sem nome';
  
  // Determinar número de telefone para exibição
  let displayPhone = contact.phone;
  if (!isGroup && contact.phone) {
    // Para contatos, limpar o número para exibição
    displayPhone = contact.phone
      .replace('@c.us', '')
      .replace('@s.whatsapp.net', '');
    
    // Formatar número brasileiro se possível
    if (displayPhone.length === 13 && displayPhone.startsWith('55')) {
      // Formato: 5544999999999 -> (44) 99999-9999
      const ddd = displayPhone.substring(2, 4);
      const number = displayPhone.substring(4);
      const part1 = number.substring(0, 5);
      const part2 = number.substring(5);
      displayPhone = `(${ddd}) ${part1}-${part2}`;
    } else if (displayPhone.length === 12 && displayPhone.startsWith('55')) {
      // Formato: 554499999999 -> (44) 99999-9999
      const ddd = displayPhone.substring(2, 4);
      const number = displayPhone.substring(4);
      const part1 = number.substring(0, 5);
      const part2 = number.substring(5);
      displayPhone = `(${ddd}) ${part1}-${part2}`;
    }
  } else if (isGroup) {
    // Para grupos, usar o nome do grupo
    displayName = contact.name || 'Grupo sem nome';
    displayPhone = 'Grupo'; // Não mostrar ID do grupo
  }
  
  return {
    id: contact.id,
    displayName,
    displayPhone,
    avatarUrl: contact.profile_pic_url,
    isGroup,
    isBusiness: contact.is_business || false,
    isVerified: contact.is_verified || false,
    status: contact.status,
    lastSeen: contact.last_seen,
    hasMessages: contact.has_messages || false,
    originalData: contact
  };
}

/**
 * Processa uma lista de contatos para exibição
 */
export function processContactsForDisplay(contacts: WhatsAppContact[]): ProcessedContact[] {
  return contacts.map(processContactForDisplay);
}

/**
 * Filtra contatos por tipo (contatos vs grupos)
 */
export function filterContactsByType(
  contacts: ProcessedContact[], 
  type: 'all' | 'contacts' | 'groups' = 'all'
): ProcessedContact[] {
  switch (type) {
    case 'contacts':
      return contacts.filter(c => !c.isGroup);
    case 'groups':
      return contacts.filter(c => c.isGroup);
    default:
      return contacts;
  }
}

/**
 * Ordena contatos por relevância (com mensagens primeiro, depois por nome)
 */
export function sortContactsByRelevance(contacts: ProcessedContact[]): ProcessedContact[] {
  return contacts.sort((a, b) => {
    // Primeiro: contatos com mensagens
    if (a.hasMessages && !b.hasMessages) return -1;
    if (!a.hasMessages && b.hasMessages) return 1;
    
    // Segundo: grupos depois de contatos
    if (a.isGroup && !b.isGroup) return 1;
    if (!a.isGroup && b.isGroup) return -1;
    
    // Terceiro: ordem alfabética por nome
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Gera iniciais para avatar quando não há foto
 */
export function generateInitials(name: string): string {
  if (!name) return '?';
  
  const words = name.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Verifica se um contato está online (baseado no last_seen)
 */
export function isContactOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  // Considerar online se foi visto nos últimos 5 minutos
  return diffMinutes <= 5;
}

/**
 * Formata timestamp para exibição
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Obtém o número limpo de um contato (para envio de mensagens)
 */
export function getCleanPhoneNumber(contact: WhatsAppContact): string | null {
  if (contact.is_group || contact.id_type === 'group') {
    return null; // Grupos não têm número de telefone
  }
  
  if (!contact.phone) return null;
  
  return contact.phone
    .replace('@c.us', '')
    .replace('@s.whatsapp.net', '');
} 

// Função para obter número original e formatado
export const getPhoneInfo = (phone: string) => {
  if (!phone) return { original: '', formatted: '', display: '' };
  
  // Se já tem @c.us, é o formato original
  if (phone.includes('@c.us')) {
    const cleanNumber = phone.replace('@c.us', '');
    return {
      original: phone,
      formatted: phone,
      display: formatDisplayPhone(cleanNumber)
    };
  }
  
  // Remover caracteres especiais e espaços
  let cleanNumber = phone.replace(/[^\d]/g, '');
  
  // Validar se o número tem pelo menos 10 dígitos
  if (cleanNumber.length < 10) {
    throw new Error(`Invalid phone number: ${phone}. Must have at least 10 digits.`);
  }
  
  // Adicionar código do país se não estiver presente (assumindo Brasil +55)
  if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
    cleanNumber = '55' + cleanNumber;
  }
  
  const whatsappNumber = `${cleanNumber}@c.us`;
  
  return {
    original: phone,
    formatted: whatsappNumber,
    display: formatDisplayPhone(cleanNumber)
  };
};

// Função para formatar número para exibição
const formatDisplayPhone = (cleanNumber: string): string => {
  if (cleanNumber.length === 13 && cleanNumber.startsWith('55')) {
    // Formato: 5544999999999 -> (44) 99999-9999
    const ddd = cleanNumber.substring(2, 4);
    const number = cleanNumber.substring(4);
    const part1 = number.substring(0, 5);
    const part2 = number.substring(5);
    return `(${ddd}) ${part1}-${part2}`;
  } else if (cleanNumber.length === 12 && cleanNumber.startsWith('55')) {
    // Formato: 554499999999 -> (44) 99999-9999
    const ddd = cleanNumber.substring(2, 4);
    const number = cleanNumber.substring(4);
    const part1 = number.substring(0, 5);
    const part2 = number.substring(5);
    return `(${ddd}) ${part1}-${part2}`;
  }
  
  return cleanNumber;
};

// Função para formatar número de telefone para WhatsApp
export const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return '';
  
  // Se já tem @c.us, retornar como está
  if (phone.includes('@c.us')) {
    return phone;
  }
  
  // Remover caracteres especiais e espaços
  let cleanNumber = phone.replace(/[^\d]/g, '');
  
  // Validar se o número tem pelo menos 10 dígitos
  if (cleanNumber.length < 10) {
    throw new Error(`Invalid phone number: ${phone}. Must have at least 10 digits.`);
  }
  
  // Adicionar código do país se não estiver presente (assumindo Brasil +55)
  if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
    cleanNumber = '55' + cleanNumber;
  }
  
  // Formatar para o formato do WhatsApp
  return `${cleanNumber}@c.us`;
};

// Função para validar número de telefone
export const validatePhoneNumber = (phone: string): boolean => {
  try {
    formatPhoneForWhatsApp(phone);
    return true;
  } catch {
    return false;
  }
};

// Função para limpar número de telefone (apenas números)
export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}; 