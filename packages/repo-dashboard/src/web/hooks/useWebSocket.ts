import { useEffect, useRef, useCallback, useState } from 'react';

interface WebSocketMessage {
  channel: string;
  data: any;
  timestamp: Date;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = `ws://${window.location.host}`,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectCountRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectCountRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const subscribers = subscribersRef.current.get(message.channel);
          if (subscribers) {
            subscribers.forEach(callback => callback(message.data));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          console.log(`🔄 Reconnecting... (attempt ${reconnectCountRef.current}/${reconnectAttempts})`);
          setTimeout(connect, reconnectDelay);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setIsConnected(false);
    }
  }, [url, reconnectAttempts, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    if (!subscribersRef.current.has(channel)) {
      subscribersRef.current.set(channel, new Set());
    }
    subscribersRef.current.get(channel)!.add(callback);

    // Send subscription message if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', channel }));
    }

    return () => unsubscribe(channel, callback);
  }, []);

  const unsubscribe = useCallback((channel: string, callback: (data: any) => void) => {
    const subscribers = subscribersRef.current.get(channel);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        subscribersRef.current.delete(channel);
        // Send unsubscription message if connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'unsubscribe', channel }));
        }
      }
    }
  }, []);

  const send = useCallback((channel: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ channel, data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send
  };
};

