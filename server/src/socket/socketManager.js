const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",           
      credentials: false,    
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],  
    allowEIO3: true,         
  });

  // Auth Middleware 
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Connection Handler
  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🟢 ${socket.user.name} connected (${socket.id})`);

    // Register socket
    onlineUsers.set(userId, socket.id);

    // Mark user as online in DB
    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id });

    // Broadcast online status to everyone
    socket.broadcast.emit("user_online", { userId, isOnline: true });

    // Typing Indicator
    socket.on("typing_start", ({ conversationId, recipientId }) => {
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit("user_typing", {
          userId,
          conversationId,
          isTyping: true,
        });
      }
    });

    socket.on("typing_stop", ({ conversationId, recipientId }) => {
      const recipientSocket = onlineUsers.get(recipientId);
      if (recipientSocket) {
        io.to(recipientSocket).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }
    });

    //  Join conversation room (optional room-based approach)
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`🔴 ${socket.user.name} disconnected`);
      onlineUsers.delete(userId);

      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen,
        socketId: null,
      });

      socket.broadcast.emit("user_offline", { userId, lastSeen });
    });
  });

  console.log("⚡ Socket.io initialized");
  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

const getSocketId = (userId) => onlineUsers.get(userId);

module.exports = { initSocket, getIO, getSocketId };