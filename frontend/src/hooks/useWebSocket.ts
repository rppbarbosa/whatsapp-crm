import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
  instance: string;
}

interface UseWebSocketOptions {
  instanceName: string | null;
  apiKey: string;
  onQRCodeReady?: (data: any) => void;
  onInstanceConnected?: (data: any) => void;
  onInstanceDisconnected?: (data: any) => void;
  onMessageReceived?: (data: any) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'authenticating';
  lastEvent?: string;
  errorCount: number;
  lastConnected?: string;
  lastDisconnected?: string;
}

export const useWebSocket = ({
  instanceName,
  apiKey,
  onQRCodeReady,
  onInstanceConnected,
  onInstanceDisconnected,
  onMessageReceived,
  onError,
  onConnect,
  onDisconnect
}: UseWebSocketOptions) => {
  // Memoizar os callbacks para evitar re-renderizações
  const memoizedOnQRCodeReady = useCallback(onQRCodeReady || (() => {}), [onQRCodeReady]);
  const memoizedOnInstanceConnected = useCallback(onInstanceConnected || (() => {}), [onInstanceConnected]);
  const memoizedOnInstanceDisconnected = useCallback(onInstanceDisconnected || (() => {}), [onInstanceDisconnected]);
  const memoizedOnMessageReceived = useCallback(onMessageReceived || (() => {}), [onMessageReceived]);
  const memoizedOnError = useCallback(onError || (() => {}), [onError]);
  const memoizedOnConnect = useCallback(onConnect || (() => {}), [onConnect]);
  const memoizedOnDisconnect = useCallback(onDisconnect || (() => {}), [onDisconnect]);
  const socketRef = useRef<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    errorCount: 0
  });
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<WebSocketEvent[]>([]);

  // Função para atualizar status da conexão
  const updateConnectionStatus = useCallback((status: ConnectionStatus['status'], details?: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => {
      const newStatus = { ...prev, status, ...details };
      
      if (status === 'connected') {
        newStatus.lastConnected = new Date().toISOString();
        newStatus.errorCount = 0;
      } else if (status === 'disconnected') {
        newStatus.lastDisconnected = new Date().toISOString();
      } else if (status === 'error') {
        newStatus.errorCount = prev.errorCount + 1;
      }
      
      return newStatus;
    });
  }, []);

  // Função para adicionar evento ao histórico
  const addEventToHistory = useCallback((event: WebSocketEvent) => {
    setEventHistory(prev => {
      const newHistory = [...prev, event];
      // Manter apenas os últimos 50 eventos
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      return newHistory;
    });
    setLastEvent(event);
  }, []);

  // Função para conectar
  const connect = useCallback(() => {
    if (!instanceName || !apiKey) {
      console.log('📡 WebSocket não conectado: sem instância ativa');
      updateConnectionStatus('disconnected');
      return;
    }

    try {
      // Fechar conexão existente se houver
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      updateConnectionStatus('connecting');

      const url = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log(`📡 Conectando ao WebSocket: ${url}`);

      // Criar socket
      const socket = io(url, {
        transports: ['websocket'],
        autoConnect: true
      });

      socketRef.current = socket;

      // Evento de conexão
      socket.on('connect', () => {
        console.log(`✅ WebSocket conectado: ${socket.id}`);
        updateConnectionStatus('authenticating');
        
        // Autenticar com a API key
        socket.emit('authenticate', { apiKey, instanceName });
      });

      // Evento de autenticação
      socket.on('authenticated', (data) => {
        if (data.success) {
          console.log(`✅ WebSocket autenticado para instância: ${instanceName}`);
          updateConnectionStatus('connected');
          
          // Entrar na instância
          socket.emit('join_instance', instanceName);
          
                  memoizedOnConnect();
        } else {
          console.error(`❌ Falha na autenticação WebSocket: ${data.message}`);
          updateConnectionStatus('error');
          
                  memoizedOnError(new Error(data.message));
        }
      });

      // Evento de entrada na instância
      socket.on('joined_instance', (data) => {
        console.log(`📱 Entrou na instância: ${data.instanceName}`);
      });

      // Evento de QR code pronto
      socket.on('qr_code_ready', (data) => {
        console.log(`📱 QR Code pronto via WebSocket:`, data);
        addEventToHistory({
          type: 'qr_code_ready',
          data,
          timestamp: data.timestamp,
          instance: data.instanceName
        });
        
        memoizedOnQRCodeReady(data);
      });

      // Evento de instância conectada
      socket.on('instance_connected', (data) => {
        console.log(`📱 Instância conectada via WebSocket:`, data);
        addEventToHistory({
          type: 'instance_connected',
          data,
          timestamp: data.timestamp,
          instance: data.instanceName
        });
        
        memoizedOnInstanceConnected(data);
      });

      // Evento de status atualizado
      socket.on('instance_status_updated', (data) => {
        console.log(`📱 Status da instância atualizado via WebSocket:`, data);
        addEventToHistory({
          type: 'instance_status_updated',
          data,
          timestamp: data.timestamp,
          instance: data.instanceName
        });
        
        // Se for conexão, chamar o callback de conexão
        if (data.status === 'connected') {
          memoizedOnInstanceConnected(data);
        }
      });

      // Evento de mensagem recebida
      socket.on('message_received', (data) => {
        console.log(`📱 Mensagem recebida via WebSocket:`, data);
        addEventToHistory({
          type: 'message_received',
          data,
          timestamp: data.timestamp,
          instance: data.instanceName
        });
        
        memoizedOnMessageReceived(data);
      });

      // Evento de desconexão
      socket.on('disconnect', () => {
        console.log(`📡 WebSocket desconectado`);
        updateConnectionStatus('disconnected');
        
        memoizedOnDisconnect();
      });

      // Evento de erro
      socket.on('connect_error', (error) => {
        console.error(`❌ Erro na conexão WebSocket:`, error);
        updateConnectionStatus('error');
        
        memoizedOnError(error);
      });

    } catch (error) {
      console.error(`❌ Erro ao conectar ao WebSocket:`, error);
      updateConnectionStatus('error');
      
      memoizedOnError(error);
    }
  }, [instanceName, apiKey, updateConnectionStatus, addEventToHistory]); // Remover callbacks das dependências

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    updateConnectionStatus('disconnected');
  }, [updateConnectionStatus]);

  // Função para enviar mensagem
  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && connectionStatus.status === 'connected') {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, [connectionStatus.status]);

  // Conectar automaticamente quando o hook é montado
  useEffect(() => {
    if (instanceName && apiKey) {
      console.log(`📡 Conectando WebSocket para instância: ${instanceName}`);
      connect();
    } else {
      console.log('📡 Desconectando WebSocket: sem instância ativa');
      disconnect();
    }

    // Limpar na desmontagem
    return () => {
      disconnect();
    };
  }, [instanceName, apiKey]); // Remover connect e disconnect das dependências

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionStatus.status === 'connected',
    isConnecting: connectionStatus.status === 'connecting',
    isAuthenticating: connectionStatus.status === 'authenticating',
    hasError: connectionStatus.status === 'error',
    connectionStatus,
    lastEvent,
    eventHistory,
    errorCount: connectionStatus.errorCount
  };
}; 