import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

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
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Tipos TypeScript
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  campaign?: string;
  source: 'website' | 'whatsapp' | 'referral' | 'social' | 'other';
  status: 'lead-bruto' | 'contato-realizado' | 'qualificado' | 'proposta-enviada' | 'follow-up' | 'fechado-ganho' | 'fechado-perdido';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  customer_id?: string;
  lead_id?: string;
  whatsapp_instance: string;
  whatsapp_number: string;
  status: 'open' | 'closed' | 'pending';
  pipeline_status: 'lead-bruto' | 'contato-realizado' | 'qualificado' | 'proposta-enviada' | 'follow-up' | 'fechado-ganho' | 'fechado-perdido';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Campos da view conversations_with_lead
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  lead_status?: string;
  customer_name?: string;
  customer_whatsapp?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  whatsapp_message_id?: string;
  sender_type: 'customer' | 'agent' | 'ai';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  media_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  whatsapp_number: string;
  name: string;
  email?: string;
  company?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'lead' | 'customer';
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInstance {
  id?: string;
  instance_name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready';
  qr_code?: string;
  phone_number?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  status: string;
  total: number;
  last_7_days: number;
  last_30_days: number;
}

// API de Leads
export const leadsAPI = {
  // Listar todos os leads
  getAll: async (): Promise<Lead[]> => {
    const response = await api.get('/api/leads');
    return response.data;
  },

  // Obter lead específico
  getById: async (id: string): Promise<Lead> => {
    const response = await api.get(`/api/leads/${id}`);
    return response.data;
  },

  // Criar novo lead
  create: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> => {
    const response = await api.post('/api/leads', lead);
    return response.data;
  },

  // Atualizar lead
  update: async (id: string, lead: Partial<Lead>): Promise<Lead> => {
    const response = await api.put(`/api/leads/${id}`, lead);
    return response.data;
  },

  // Deletar lead
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/leads/${id}`);
  },

  // Obter estatísticas do dashboard
  getDashboardStats: async (): Promise<DashboardStats[]> => {
    const response = await api.get('/api/leads/dashboard/stats');
    return response.data;
  },

  // Filtrar por status
  getByStatus: async (status: Lead['status']): Promise<Lead[]> => {
    const response = await api.get(`/api/leads/by-status/${status}`);
    return response.data;
  },
};

// API de Conversas (usando WhatsApp API unificada)
export const conversationsAPI = {
  // Listar todas as conversas
  getAll: async (): Promise<Conversation[]> => {
    // Por enquanto, retornar array vazio até implementar conversas via WhatsApp
    return [];
  },

  // Obter conversa específica
  getById: async (id: string): Promise<Conversation> => {
    throw new Error('Método não implementado - use WhatsApp API');
  },

  // Criar nova conversa
  create: async (conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<Conversation> => {
    throw new Error('Método não implementado - use WhatsApp API');
  },

  // Atualizar conversa
  update: async (id: string, conversation: Partial<Conversation>): Promise<Conversation> => {
    throw new Error('Método não implementado - use WhatsApp API');
  },

  // Deletar conversa
  delete: async (id: string): Promise<void> => {
    throw new Error('Método não implementado - use WhatsApp API');
  },

  // Filtrar por status do pipeline
  getByStatus: async (status: Conversation['pipeline_status']): Promise<Conversation[]> => {
    // Por enquanto, retornar array vazio
    return [];
  },

  // Obter mensagens de uma conversa
  getMessages: async (id: string, instance?: string): Promise<Message[]> => {
    if (!instance) {
      throw new Error('Instance é obrigatória');
    }
    
    try {
      const response = await whatsappApi.getConversationMessages(id, 50);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return [];
    }
  },

  // Adicionar mensagem à conversa
  addMessage: async (id: string, message: Omit<Message, 'id' | 'created_at'>): Promise<Message> => {
    throw new Error('Método não implementado - use WhatsApp API sendMessage');
  },

  // Atualizar status do pipeline
  updatePipelineStatus: async (id: string, pipeline_status: Conversation['pipeline_status']): Promise<Conversation> => {
    try {
      await whatsappApi.updatePipelineStatus(id, pipeline_status);
      // Retornar conversa mock por enquanto
      return {
        id,
        pipeline_status,
        status: 'open',
        whatsapp_instance: '',
        whatsapp_number: '',
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Conversation;
    } catch (error) {
      throw new Error('Erro ao atualizar status do pipeline');
    }
  },
};

// API de Clientes
export const customersAPI = {
  // Listar todos os clientes
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get('/api/customers');
    return response.data;
  },

  // Obter cliente específico
  getById: async (id: string): Promise<Customer> => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },

  // Criar novo cliente
  create: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
    const response = await api.post('/api/customers', customer);
    return response.data;
  },

  // Atualizar cliente
  update: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/api/customers/${id}`, customer);
    return response.data;
  },

  // Deletar cliente
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  },
};

// Interface para compatibilidade com estrutura antiga (usada internamente)
export interface WhatsAppInstanceLegacy {
  instance: {
    instanceName: string;
    status: 'connecting' | 'connected' | 'disconnected';
    qrcode?: string;
    phone_number?: string;
    logs?: Array<{
      timestamp: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
    }>;
    lastActivity?: string;
  };
}

export interface CreateInstanceRequest {
  instanceName: string;
}

export interface SendMessageRequest {
  number: string;
  text: string;
}

// API do WhatsApp (Unificada)
export const whatsappApi = {
  // Health check
  health: () => api.get('/health'),
  
  // Métodos genéricos para resolver erros de compilação
  get: (url: string) => api.get(url),
  post: (url: string, data?: any) => api.post(url, data),
  delete: (url: string) => api.delete(url),
  
  // Instâncias
  getInstance: () => api.get<{ success: boolean; hasInstance: boolean; data?: any }>('/api/whatsapp/instance'),
  
  createInstance: (data: CreateInstanceRequest) => 
    api.post<WhatsAppInstance>('/api/whatsapp/instance', data),
  
  deleteInstance: () => 
    api.delete('/api/whatsapp/instance'),

  // Status detalhado da instância
  getInstanceStatus: () =>
    api.get<{ success: boolean; instance?: any }>('/api/whatsapp/instance/status'),

  // Limpeza inteligente da instância (só fecha se não autenticada)
  cleanupInstance: (instanceName: string, force: boolean = false) =>
    api.post<{ success: boolean; message: string; status?: string; phone?: string }>('/api/whatsapp/instance/cleanup', { instanceName, force }),

  // Forçar parada da instância (mesmo se autenticada)
  forceStopInstance: (instanceName: string) =>
    api.post<{ success: boolean; message: string }>('/api/whatsapp/instance/force-stop', { instanceName }),
  
  // QR Code
  getQRCode: () => 
    api.get<{ success: boolean; qrCode?: string; instanceName?: string; timestamp?: string }>('/api/whatsapp/instance/qr-code'),
  
  refreshQRCode: () => 
    api.post<{ success: boolean; message: string; instanceName: string }>('/api/whatsapp/instance/refresh-qr'),
  
  // Sincronização
  syncContacts: () => 
    api.post('/api/whatsapp/instance/sync'),
  
  syncMessages: (limit: number = 100) => 
    api.post('/api/whatsapp/instance/sync'),
  
  // Contatos
  getContacts: (forceRefresh: boolean = false) => 
    api.get('/api/whatsapp/chats'),
  
  // Conversas
  getConversations: (forceRefresh: boolean = false) => 
    api.get<any[]>('/api/whatsapp/instance/conversations'),
  
  // Mensagens
  getConversationMessages: (contactId: string, limit: number = 50) => 
    api.get<any[]>(`/api/whatsapp/chats/${contactId}/messages?limit=${limit}`),
  
  sendMessage: (data: SendMessageRequest) => 
    api.post('/api/whatsapp/instance/send-message', {
      ...data,
      clientMessageId: data && (data as any).clientMessageId,
    }),
  
  // CRM
  linkContactToLead: (contactId: string, leadId: string, notes?: string) => 
    api.post(`/api/whatsapp/contacts/${contactId}/link-lead`, { leadId, notes }),
  
  updatePipelineStatus: (contactId: string, pipelineStatus: string) => 
    api.put(`/api/whatsapp/contacts/${contactId}/pipeline-status`, { pipelineStatus }),
};

export const whatsappStream = {
  subscribeConversation: (contactId: string, instanceName: string, onEvent: (e: any) => void) => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const url = `${base}/api/whatsapp/conversations/${contactId}/stream?instance=${instanceName}`;
    const es = new EventSource(url, { withCredentials: false } as any);
    es.onmessage = (evt) => {
      try { onEvent(JSON.parse(evt.data)); } catch {}
    };
    es.onerror = () => { /* silencioso */ };
    return () => es.close();
  }
};

// API de IA
export const aiAPI = {
  // Processar mensagem com IA
  processMessage: async (message: string, context?: string): Promise<{ response: string }> => {
    const response = await api.post('/api/ai/process', { message, context });
    return response.data;
  },
};

export const realtime = {
  subscribeMessages: (
    instanceName: string,
    contactId: string,
    onInsert: (row: any) => void
  ) => {
    const SUPABASE_URL: string | undefined = (process.env.REACT_APP_SUPABASE_URL as string) || undefined;
    const SUPABASE_ANON: string | undefined = (process.env.REACT_APP_SUPABASE_ANON_KEY as string) || undefined;
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return () => {};
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
      global: { headers: { apikey: SUPABASE_ANON } },
    });
    const plain = contactId.includes('@c.us') ? contactId.replace('@c.us', '') : contactId;
    const channel = supabase
      .channel(`msg_${instanceName}_${plain}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `instance_name=eq.${instanceName},from_id=eq.${plain}`,
        },
        (payload: any) => onInsert(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
          filter: `instance_name=eq.${instanceName},to_id=eq.${plain}`,
        },
        (payload: any) => onInsert(payload.new)
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  },
};

export default api; 