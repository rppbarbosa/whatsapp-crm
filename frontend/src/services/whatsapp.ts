import axios from 'axios';
import { API_BASE_URL, EVOLUTION_API_KEY } from '../config';

const api = axios.create({
  baseURL: `${API_BASE_URL}/baileys`,
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY
  }
});

export interface WhatsAppInstance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting';
  qr_code: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppContact {
  id: string;
  instance_name: string;
  phone: string;
  name: string;
  push_name: string | null;
  business_name: string | null;
  is_business: boolean;
  is_enterprise: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  instance_name: string;
  from_id: string;
  to_id: string;
  body: string;
  is_from_me: boolean;
  has_media: boolean;
  media_type: string | null;
  timestamp: number;
  status: string;
  created_at: string;
  updated_at: string;
}

class WhatsAppService {
  // Instâncias
  async listInstances() {
    const response = await api.get<{ success: boolean; data: WhatsAppInstance[] }>('/instances');
    return response.data.data;
  }

  async createInstance(name: string) {
    const response = await api.post<{ success: boolean; data: any }>('/instances', { name });
    return response.data.data;
  }

  async connectInstance(name: string) {
    const response = await api.post<{ success: boolean; message: string }>('/connect', { instanceName: name });
    return response.data;
  }

  async disconnectInstance(name: string) {
    const response = await api.post<{ success: boolean; message: string }>('/disconnect', { instanceName: name });
    return response.data;
  }

  async deleteInstance(name: string) {
    const response = await api.delete<{ success: boolean; message: string }>(`/instances/${name}`);
    return response.data;
  }

  async getInstanceStatus(name: string) {
    const response = await api.get<{ success: boolean; data: { status: string; error: string | null } }>(`/instances/${name}/status`);
    return response.data.data;
  }

  // Contatos
  async listContacts(instanceName: string) {
    const response = await api.get<{ success: boolean; data: WhatsAppContact[] }>(`/instances/${instanceName}/contacts`);
    return response.data.data;
  }

  async syncContacts(instanceName: string) {
    const response = await api.post<{ success: boolean; message: string }>(`/instances/${instanceName}/sync`);
    return response.data;
  }

  // Mensagens
  async sendMessage(instanceName: string, to: string, message: string) {
    const response = await api.post<{ success: boolean; data: any }>('/send', { instanceName, to, message });
    return response.data.data;
  }

  async listMessages(instanceName: string, contactId: string, limit = 50) {
    const response = await api.get<{ success: boolean; data: WhatsAppMessage[] }>(
      `/instances/${instanceName}/messages?contactId=${contactId}&limit=${limit}`
    );
    return response.data.data;
  }

  // WebSocket
  setCallbacks(callbacks: {
    onQR?: (qr: string) => void;
    onStatus?: (status: any) => void;
    onMessage?: (message: any) => void;
  }) {
    // Implementar quando tivermos WebSocket funcionando
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;