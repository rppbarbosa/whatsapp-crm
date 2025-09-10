// Normaliza a base para sempre incluir "/api" (compatível com diferentes .env)
const RAW_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const API_BASE_URL = `${RAW_BASE_URL}/api`;

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: 'website' | 'whatsapp' | 'referral' | 'social' | 'other';
  status: 'lead-bruto' | 'contato-realizado' | 'qualificado' | 'proposta-enviada' | 'follow-up' | 'fechado-ganho' | 'fechado-perdido';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadStats {
  total: number;
  porStatus: Record<string, number>;
  porPrioridade: Record<string, number>;
  ultimos7Dias: number;
  ultimos30Dias: number;
}

class LeadsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/leads${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('');
  }

  async getLead(id: string): Promise<Lead> {
    return this.request<Lead>(`/${id}`);
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    return this.request<Lead>('', {
      method: 'POST',
      body: JSON.stringify(lead),
    });
  }

  async updateLead(id: string, lead: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lead),
    });
  }

  async deleteLead(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async getStats(): Promise<LeadStats> {
    return this.request<LeadStats>('/stats/dashboard');
  }
}

export const leadsService = new LeadsService();
