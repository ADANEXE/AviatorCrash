import { useEffect, useRef, useState, useCallback } from "react";

// Define the WebSocket message types
export type WebSocketMessage = {
  type: string;
  data: any;
};

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    socket.onclose = () => {
      setIsConnected(false);
      // Try to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    socket.onerror = (event) => {
      setError("WebSocket connection error");
      console.error("WebSocket error:", event);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle messages based on their type
        const handlers = messageHandlersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message.data));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const send = useCallback((type: string, data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, data }));
    } else {
      setError("Cannot send message: WebSocket is not connected");
    }
  }, []);

  const addMessageHandler = useCallback((type: string, handler: (data: any) => void) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, []);
    }
    messageHandlersRef.current.get(type)!.push(handler);
  }, []);

  const removeMessageHandler = useCallback((type: string, handler: (data: any) => void) => {
    const handlers = messageHandlersRef.current.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }, []);

  // Automatically connect on mount and disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    send,
    addMessageHandler,
    removeMessageHandler,
    connect,
    disconnect
  };
}
