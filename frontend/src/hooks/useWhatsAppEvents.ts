import { useEffect, useRef, useCallback, useState } from 'react';

interface WhatsAppEvent {
  type: string;
  data: any;
  timestamp: string;
  instance: string;
  eventId?: string;
}

interface UseWhatsAppEventsOptions {
  instanceName: string;
  apiKey: string;
  onMessageReceived?: (data: any) => void;
  onMessageSent?: (data: any) => void;
  onMessageStatus?: (data: any) => void;
  onContactUpdate?: (data: any) => void;
  onPresenceUpdate?: (data: any) => void;
  onInstanceUpdate?: (data: any) => void;
  onContactsSync?: (data: any) => void;
  onMessagesSync?: (data: any) => void;
  onConnection?: (data: any) => void;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
  onDisconnect?: () => void;
}

interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastEvent?: string;
  errorCount: number;
  reconnectAttempts: number;
  lastConnected?: string;
  lastDisconnected?: string;
}

export const useWhatsAppEvents = ({
  instanceName,
  apiKey,
  onMessageReceived,
  onMessageSent,
  onMessageStatus,
  onContactUpdate,
  onPresenceUpdate,
  onInstanceUpdate,
  onContactsSync,
  onMessagesSync,
  onConnection,
  onError,
  onReconnect,
  onDisconnect
}: UseWhatsAppEventsOptions) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000); // Delay inicial de 1 segundo
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    errorCount: 0,
    reconnectAttempts: 0
  });

  const [lastEvent, setLastEvent] = useState<WhatsAppEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<WhatsAppEvent[]>([]);

  // Função para atualizar status da conexão
  const updateConnectionStatus = useCallback((status: ConnectionStatus['status'], details?: Partial<ConnectionStatus>) => {
    setConnectionStatus(prev => {
      const newStatus = { ...prev, status, ...details };
      
      if (status === 'connected') {
        newStatus.lastConnected = new Date().toISOString();
        newStatus.errorCount = 0;
        newStatus.reconnectAttempts = 0;
      } else if (status === 'disconnected') {
        newStatus.lastDisconnected = new Date().toISOString();
      } else if (status === 'error') {
        newStatus.errorCount = prev.errorCount + 1;
      } else if (status === 'reconnecting') {
        newStatus.reconnectAttempts = prev.reconnectAttempts + 1;
      }
      
      return newStatus;
    });
  }, []);

  // Função para adicionar evento ao histórico
  const addEventToHistory = useCallback((event: WhatsAppEvent) => {
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

  // Função para limpar histórico
  const clearEventHistory = useCallback(() => {
    setEventHistory([]);
    setLastEvent(null);
  }, []);

  // Função para conectar (TEMPORARIAMENTE DESABILITADA)
  const connect = useCallback(() => {
    if (!instanceName || !apiKey) {
      console.warn('⚠️ Instance name or API key not provided for SSE connection');
      updateConnectionStatus('error');
      return;
    }

    // TEMPORARIAMENTE DESABILITADO - SSE não está funcionando com autenticação
    console.log(`⚠️ SSE temporariamente desabilitado para instância: ${instanceName}`);
    updateConnectionStatus('disconnected');
    return;

    // TODO: Implementar WebSocket ou polling como alternativa ao SSE
    // O EventSource não suporta headers de autenticação
  }, [instanceName, apiKey, updateConnectionStatus]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log(`📡 Desconectando SSE para instância: ${instanceName}`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttempts.current = 0;
    updateConnectionStatus('disconnected');
    
    if (onDisconnect) {
      onDisconnect();
    }
  }, [instanceName, onDisconnect, updateConnectionStatus]);

  // Função para reconectar manualmente
  const reconnect = useCallback(() => {
    console.log(`🔄 Reconexão manual solicitada para ${instanceName}`);
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
    disconnect();
    
    // Pequeno delay antes de reconectar
    setTimeout(() => {
      connect();
    }, 1000);
  }, [instanceName, connect, disconnect]);

  // Função para testar conexão
  const testConnection = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/whatsapp/events/stats`);
      if (response.ok) {
        const stats = await response.json();
        console.log('📊 Status da conexão SSE:', stats);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao testar conexão SSE:', error);
      return false;
    }
  }, []);

  // Conectar automaticamente quando o hook é montado
  useEffect(() => {
    if (instanceName && apiKey) {
      connect();
    }

    // Limpar na desmontagem
    return () => {
      disconnect();
    };
  }, [instanceName, apiKey]); // Removidas as dependências circulares

  // Reconectar quando instanceName ou apiKey mudarem (desabilitado temporariamente)
  /*
  useEffect(() => {
    if (instanceName && apiKey) {
      disconnect();
      setTimeout(() => {
        connect();
      }, 500);
    }
  }, [instanceName, apiKey]);
  */

  // Monitorar saúde da conexão (desabilitado temporariamente para evitar loops)
  /*
  useEffect(() => {
    if (connectionStatus.status === 'connected') {
      // Verificar saúde da conexão a cada 30 segundos
      const healthCheck = setInterval(async () => {
        const isHealthy = await testConnection();
        if (!isHealthy) {
          console.warn('⚠️ Conexão SSE pode estar instável, tentando reconectar...');
          reconnect();
        }
      }, 30000);

      return () => clearInterval(healthCheck);
    }
  }, [connectionStatus.status, testConnection, reconnect]);
  */

  return {
    connect,
    disconnect,
    reconnect,
    testConnection,
    clearEventHistory,
    isConnected: connectionStatus.status === 'connected',
    isConnecting: connectionStatus.status === 'connecting',
    isReconnecting: connectionStatus.status === 'reconnecting',
    hasError: connectionStatus.status === 'error',
    connectionStatus,
    lastEvent,
    eventHistory,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    errorCount: connectionStatus.errorCount
  };
}; 