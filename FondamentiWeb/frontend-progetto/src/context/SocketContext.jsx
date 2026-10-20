import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = 'http://localhost:5000';

export function SocketProvider({ children, token: propToken }) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const socketRef = useRef(null);
  const activeRoomsRef = useRef([]);
  activeRoomsRef.current = activeRooms;

  useEffect(() => {
    const token = propToken !== undefined ? propToken : localStorage.getItem('token');
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setActiveRooms([]);
      }
      return;
    }

    const socketInstance = io(SOCKET_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      addDebugEvent('CONNECT', { socketId: socketInstance.id });
      // Rientra automaticamente nelle stanze che erano attive
      activeRoomsRef.current.forEach((roomId) => {
        socketInstance.emit('join_list', roomId);
      });
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      addDebugEvent('DISCONNECT', { reason });
    });

    socketInstance.on('connect_error', (err) => {
      setIsConnected(false);
      addDebugEvent('ERROR', { message: err.message });
    });

    socketInstance.onAny((eventName, ...args) => {
      addDebugEvent(eventName, args.length === 1 ? args[0] : args);
    });

    socketRef.current = socketInstance;

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [propToken]);

  const addDebugEvent = (eventName, payload) => {
    const newEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      event: eventName,
      payload,
    };
    setRecentEvents((prev) => [newEntry, ...prev.slice(0, 29)]);
  };

  const joinList = (listId) => {
    if (!listId || !socketRef.current) return;
    socketRef.current.emit('join_list', listId);
    setActiveRooms((prev) => (prev.includes(listId) ? prev : [...prev, listId]));
    addDebugEvent('CLIENT_JOIN_LIST', { listId });
  };

  const leaveList = (listId) => {
    if (!listId || !socketRef.current) return;
    socketRef.current.emit('leave_list', listId);
    setActiveRooms((prev) => prev.filter((id) => id !== listId));
    addDebugEvent('CLIENT_LEAVE_LIST', { listId });
  };

  const clearEvents = () => {
    setRecentEvents([]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        activeRooms,
        recentEvents,
        joinList,
        leaveList,
        clearEvents,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve essere usato all\'interno di un SocketProvider');
  }
  return context;
}
