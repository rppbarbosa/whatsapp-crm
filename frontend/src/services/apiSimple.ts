import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_KEY = process.env.REACT_APP_API_KEY || 'whatsapp-crm-evolution-key-2024-secure';

// Configurar axios com headers padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY
  }
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface WhatsAppStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  isReady: boolean;
  qrCode?: string;
  phone?: string;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
  unreadCount: number;
}

export interface MediaInfo {
  type: string;
  hasMedia: boolean;
  filename?: string;
  mimetype?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
  url?: string;
  error?: string;
}

export interface Message {
  id: string;
  body: string;
  timestamp: number;
  from: string;
  to: string;
  isFromMe: boolean;
  type: string;
  author?: string;
  quotedMsg?: {
    body: string;
    author: string;
  };
  mediaInfo?: MediaInfo;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  totalMessages?: number;
  hasMoreHistory?: boolean;
  hasMore?: boolean;
}

export const whatsappApi = {
  // Status do WhatsApp
  getStatus: (): Promise<{ data: { success: boolean; data: WhatsAppStatus } }> =>
    api.get('/api/whatsapp/status'),

  // Inicializar WhatsApp
  initialize: (): Promise<{ data: { success: boolean; message: string } }> =>
    api.post('/api/whatsapp/initialize'),

  // Obter QR Code
  getQRCode: (): Promise<{ data: { success: boolean; qrCode?: string; status?: string } }> =>
    api.get('/api/whatsapp/qr'),

  // Obter conversas
  getChats: (): Promise<{ data: { success: boolean; data: Chat[] } }> =>
    api.get('/api/whatsapp/chats'),

  // Obter mensagens de uma conversa com histórico
  getMessages: (chatId: string, limit: number = 50, loadHistory: boolean = true): Promise<{ data: MessagesResponse }> =>
    api.get(`/api/whatsapp/chats/${chatId}/messages?limit=${limit}&loadHistory=${loadHistory}`),

  // Carregar mensagens anteriores (paginação)
  getEarlierMessages: (chatId: string, beforeMessageId: string, limit: number = 50): Promise<{ data: MessagesResponse }> =>
    api.get(`/api/whatsapp/chats/${chatId}/messages/earlier?beforeMessageId=${beforeMessageId}&limit=${limit}`),

  // Enviar mensagem
  sendMessage: (to: string, message: string): Promise<{ data: { success: boolean; data: { messageId: string } } }> =>
    api.post('/api/whatsapp/send', { to, message }),

  // Enviar mídia
  sendMedia: (to: string, media: string, filename: string, mimetype: string, caption?: string): Promise<{ data: { success: boolean; data: { messageId: string } } }> =>
    api.post('/api/whatsapp/send-media', { to, media, filename, mimetype, caption }),

  // Marcar conversa como lida
  markChatAsRead: (chatId: string): Promise<{ data: { success: boolean; message: string } }> =>
    api.post(`/api/whatsapp/chats/${chatId}/mark-read`),

  // Desconectar WhatsApp
  destroy: (): Promise<{ data: { success: boolean; message: string } }> =>
    api.post('/api/whatsapp/destroy'),

  // Dashboard APIs
  getInstanceStatus: (): Promise<{ data: { success: boolean; data?: { status: string } } }> =>
    api.get('/api/whatsapp/status'),

  // Fazer requisições genéricas
  get: (url: string): Promise<{ data: any }> =>
    api.get(url)
};

export default api;
