import { WS_BASE_URL } from '../config';

export interface WebSocketMessage {
  type: 'status' | 'qr' | 'message';
  data: any;
  instanceName?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: {
    onStatus?: (status: any) => void;
    onQR?: (qr: string, instanceName: string) => void;
    onMessage?: (message: any) => void;
    onError?: (error: any) => void;
  } = {};

  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`${WS_BASE_URL}/baileys/socket`);

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'status':
            if (this.callbacks.onStatus) {
              this.callbacks.onStatus(data.data);
            }
            break;
          
          case 'qr':
            if (this.callbacks.onQR && data.instanceName) {
              this.callbacks.onQR(data.data, data.instanceName);
            }
            break;
          
          case 'message':
            if (this.callbacks.onMessage) {
              this.callbacks.onMessage(data.data);
            }
            break;
        }
      } catch (error) {
        console.error('Erro ao processar mensagem do WebSocket:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket fechado');
      // Tentar reconectar em 5 segundos
      this.reconnectTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CLOSED) {
          this.connect();
        }
      }, 5000);
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  setCallbacks(callbacks: {
    onStatus?: (status: any) => void;
    onQR?: (qr: string, instanceName: string) => void;
    onMessage?: (message: any) => void;
    onError?: (error: any) => void;
  }) {
    this.callbacks = callbacks;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

const websocketService = new WebSocketService();
export default websocketService;