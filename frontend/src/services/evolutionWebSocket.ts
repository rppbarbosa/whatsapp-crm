import { io, Socket } from 'socket.io-client';

export interface EvolutionEvent {
  type: string;
  data: any;
  timestamp: string;
  instance?: string;
}

export interface EvolutionWebSocketOptions {
  url: string;
  apiKey: string;
  instanceName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthenticated?: (data: any) => void;
  onAuthError?: (error: any) => void;
  onEvolutionEvent?: (event: EvolutionEvent) => void;
  onMessageReceived?: (data: any) => void;
  onMessageSent?: (data: any) => void;
  onInstanceUpdate?: (data: any) => void;
  onError?: (error: any) => void;
}

class EvolutionWebSocketService {
  private socket: Socket | null = null;
  private options: EvolutionWebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(options: EvolutionWebSocketOptions) {
    this.options = options;
  }

  // Conectar ao WebSocket
  connect() {
    if (this.isConnecting || this.socket?.connected) {
      console.log('⚠️ Já conectando ou conectado');
      return;
    }

    try {
      this.isConnecting = true;
      console.log(`🔌 Conectando ao Evolution WebSocket: ${this.options.url}`);

      // Criar conexão Socket.IO
      this.socket = io(this.options.url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Configurar eventos
      this.setupSocketEvents();

      // Tentar autenticação após conexão
      this.socket.on('connect', () => {
        console.log('✅ Conectado ao Evolution WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        if (this.options.onConnect) {
          this.options.onConnect();
        }

        // Autenticar automaticamente
        this.authenticate();
      });

    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      this.isConnecting = false;
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  // Configurar eventos do Socket.IO
  private setupSocketEvents() {
    if (!this.socket) return;

    // Evento de desconexão
    this.socket.on('disconnect', (reason) => {
      console.log(`📡 Desconectado do Evolution WebSocket: ${reason}`);
      this.isConnecting = false;
      
      if (this.options.onDisconnect) {
        this.options.onDisconnect();
      }

      // Tentar reconectar automaticamente
      this.handleReconnect();
    });

    // Evento de erro
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error);
      this.isConnecting = false;
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    });

    // Evento de autenticação
    this.socket.on('authenticated', (data) => {
      console.log('🔐 Autenticado com sucesso:', data);
      
      if (this.options.onAuthenticated) {
        this.options.onAuthenticated(data);
      }
    });

    // Evento de erro de autenticação
    this.socket.on('auth_error', (error) => {
      console.error('❌ Erro de autenticação:', error);
      
      if (this.options.onAuthError) {
        this.options.onAuthError(error);
      }
    });

    // Evento de Evolution API
    this.socket.on('evolution_event', (event: EvolutionEvent) => {
      console.log('📡 Evento Evolution recebido:', event);
      
      if (this.options.onEvolutionEvent) {
        this.options.onEvolutionEvent(event);
      }

      // Processar tipos específicos de eventos
      this.handleEvolutionEvent(event);
    });

    // Evento de instância WebSocket pronta
    this.socket.on('instance_websocket_ready', (data) => {
      console.log('📱 WebSocket da instância pronto:', data);
    });
  }

  // Autenticar com a API
  private authenticate() {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket não conectado para autenticação');
      return;
    }

    try {
      const authData = {
        apiKey: this.options.apiKey,
        instanceName: this.options.instanceName
      };

      console.log('🔐 Autenticando...', { instanceName: this.options.instanceName });
      this.socket.emit('authenticate', authData);

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      
      if (this.options.onError) {
        this.options.onError(error);
      }
    }
  }

  // Processar eventos Evolution
  private handleEvolutionEvent(event: EvolutionEvent) {
    try {
      switch (event.type) {
        case 'message_received':
          if (this.options.onMessageReceived) {
            this.options.onMessageReceived(event.data);
          }
          break;

        case 'message_sent':
          if (this.options.onMessageSent) {
            this.options.onMessageSent(event.data);
          }
          break;

        case 'instance_status':
        case 'instance_connected':
        case 'instance_created':
        case 'instance_deleted':
          if (this.options.onInstanceUpdate) {
            this.options.onInstanceUpdate(event.data);
          }
          break;

        default:
          console.log(`📡 Evento Evolution não processado: ${event.type}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar evento Evolution:', error);
    }
  }

  // Reconectar automaticamente
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Máximo de tentativas de reconexão atingido (${this.maxReconnectAttempts})`);
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Tentando reconectar em ${delay}ms... (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Desconectar
  disconnect() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.socket) {
        console.log('📡 Desconectando do Evolution WebSocket...');
        this.socket.disconnect();
        this.socket = null;
      }

      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      console.log('✅ Desconectado do Evolution WebSocket');

    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Verificar se está conectando
  getIsConnecting(): boolean {
    return this.isConnecting;
  }

  // Obter estatísticas da conexão
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      connecting: this.getIsConnecting(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Reconectar manualmente
  reconnect() {
    console.log('🔄 Reconexão manual solicitada');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.disconnect();
    
    // Pequeno delay antes de reconectar
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Enviar evento personalizado
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket não conectado para enviar evento');
    }
  }

  // Escutar evento personalizado
  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remover listener de evento
  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

export default EvolutionWebSocketService; 