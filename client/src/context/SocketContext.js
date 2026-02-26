import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); 

  useEffect(() => {
    if (!token || !user) return;

    const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"], 
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected");
    });

    socket.on("user_online", ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socket.on("user_offline", ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      setTypingUsers(prev => {
        const current = prev[conversationId] || [];
        if (isTyping) {
          return { ...prev, [conversationId]: [...new Set([...current, userId])] };
        } else {
          return { ...prev, [conversationId]: current.filter(id => id !== userId) };
        }
      });
    });

    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  const emitTypingStart = (conversationId, recipientId) => {
    socketRef.current?.emit("typing_start", { conversationId, recipientId });
  };

  const emitTypingStop = (conversationId, recipientId) => {
    socketRef.current?.emit("typing_stop", { conversationId, recipientId });
  };

  const onNewMessage = (callback) => {
    socketRef.current?.on("new_message", callback);
    return () => socketRef.current?.off("new_message", callback);
  };

  const onMessagesRead = (callback) => {
    socketRef.current?.on("messages_read", callback);
    return () => socketRef.current?.off("messages_read", callback);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      onlineUsers,
      typingUsers,
      emitTypingStart,
      emitTypingStop,
      onNewMessage,
      onMessagesRead,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);