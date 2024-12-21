const socketIO = require('socket.io');
const { createAdapter } = require('@socket.io/mongo-adapter');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('user_join', async (userData) => {
      const { userId, userName } = userData;
      activeUsers.set(socket.id, { userId, userName });
      
      // Join personal room for private messages
      socket.join(userId);
      
      // Broadcast active users list
      io.emit('active_users', Array.from(activeUsers.values()));
    });

    // Handle private messages
    socket.on('private_message', async (data) => {
      const { to, message, from } = data;
      
      try {
        // Save message to database
        const newMessage = await Message.create({
          sender: from,
          recipient: to,
          content: message,
          type: 'private'
        });

        // Send to recipient and sender
        io.to(to).emit('private_message', {
          message: newMessage,
          from
        });
        
        socket.emit('private_message', {
          message: newMessage,
          to
        });
      } catch (error) {
        console.error('Error saving private message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle group messages
    socket.on('group_message', async (data) => {
      const { roomId, message, from } = data;
      
      try {
        const newMessage = await Message.create({
          sender: from,
          roomId,
          content: message,
          type: 'group'
        });

        io.to(roomId).emit('group_message', {
          message: newMessage,
          from
        });
      } catch (error) {
        console.error('Error saving group message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Join chat room
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50);
      socket.emit('room_messages', messages.reverse());
    });

    // Leave chat room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      io.emit('active_users', Array.from(activeUsers.values()));
    });
  });

  return io;
}

module.exports = initializeSocket;