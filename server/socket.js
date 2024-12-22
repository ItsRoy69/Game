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

  // Check room expiration
  const isRoomExpired = async (roomId) => {
    try {
      const room = await ChatRoom.findById(roomId);
      return !room || room.expiresAt <= new Date();
    } catch (error) {
      console.error('Error checking room expiration:', error);
      return true;
    }
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('user_join', async (userData) => {
      const { userId, userName } = userData;
      
      // Store user data
      activeUsers.set(socket.id, { userId, userName });
      
      // Join personal room for private messages
      socket.join(userId);
      
      // Broadcast updated active users list
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

        // Send to recipient
        io.to(to).emit('private_message', {
          message: newMessage,
          from
        });
        
        // Send confirmation to sender
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
        // Check if room has expired
        if (await isRoomExpired(roomId)) {
          socket.emit('room_expired', { roomId });
          socket.leave(roomId);
          return;
        }

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
    socket.on('join_room', async (data) => {
      const { roomId, userId } = data;
      
      try {
        // Check if room exists and hasn't expired
        const room = await ChatRoom.findOne({
          _id: roomId,
          expiresAt: { $gt: new Date() }
        });

        if (!room) {
          socket.emit('room_expired', { roomId });
          return;
        }

        // Check if user is member of private room
        if (room.type === 'private' && !room.members.includes(userId)) {
          socket.emit('error', { message: 'Not authorized to join this room' });
          return;
        }

        // Join the room
        socket.join(roomId);

        // Get recent messages
        const messages = await Message.find({ 
          roomId,
          type: 'group'
        })
          .sort({ createdAt: -1 })
          .limit(50);

        // Send room join confirmation and messages
        socket.emit('room_joined', {
          roomId,
          messages: messages.reverse(),
          expiresAt: room.expiresAt
        });

        // Notify room members
        socket.to(roomId).emit('user_joined_room', {
          userId,
          userName: activeUsers.get(socket.id)?.userName
        });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave chat room
    socket.on('leave_room', async (data) => {
      const { roomId, userId } = data;
      
      socket.leave(roomId);
      
      // Notify room members
      socket.to(roomId).emit('user_left_room', {
        userId,
        userName: activeUsers.get(socket.id)?.userName
      });
    });

    // Handle room expiration check
    socket.on('check_room_expiration', async (roomId) => {
      try {
        if (await isRoomExpired(roomId)) {
          socket.emit('room_expired', { roomId });
        }
      } catch (error) {
        console.error('Error checking room expiration:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { roomId, userId, userName } = data;
      socket.to(roomId).emit('user_typing', { userId, userName });
    });

    socket.on('typing_stop', (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit('user_stopped_typing', { userId });
    });

    // Handle read receipts
    socket.on('mark_messages_read', async (data) => {
      const { messageIds, userId } = data;
      
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            recipient: userId,
            read: false
          },
          { read: true }
        );

        // Notify message senders
        const messages = await Message.find({ _id: { $in: messageIds } });
        messages.forEach(msg => {
          io.to(msg.sender).emit('message_read', {
            messageId: msg._id,
            readBy: userId
          });
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userData = activeUsers.get(socket.id);
      
      if (userData) {
        // Notify all rooms the user was in
        io.emit('user_offline', {
          userId: userData.userId,
          userName: userData.userName
        });
      }
      
      // Remove from active users
      activeUsers.delete(socket.id);
      
      // Broadcast updated active users list
      io.emit('active_users', Array.from(activeUsers.values()));
      
      console.log('User disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An unexpected error occurred' });
    });
  });

  // Periodic room expiration check
  setInterval(async () => {
    try {
      const expiredRooms = await ChatRoom.find({
        expiresAt: { $lte: new Date() }
      });

      for (const room of expiredRooms) {
        io.to(room._id.toString()).emit('room_expired', { roomId: room._id });
        io.in(room._id.toString()).socketsLeave(room._id.toString());
      }
    } catch (error) {
      console.error('Error in periodic room expiration check:', error);
    }
  }, 60 * 1000); // Check every minute

  return io;
}

module.exports = initializeSocket;