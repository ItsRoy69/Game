const socketIO = require("socket.io");
const { createAdapter } = require("@socket.io/mongo-adapter");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const ChatRoom = require("./models/ChatRoom");
const Notification = require("./models/Notification");

function initializeSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  const activeUsers = new Map();
  const userRooms = new Map();
  const isRoomExpired = async (roomId) => {
    try {
      const room = await ChatRoom.findById(roomId);
      return !room || room.expiresAt <= new Date();
    } catch (error) {
      console.error("Error checking room expiration:", error);
      return true;
    }
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("user_join", async (userData) => {
      const { userId, userName } = userData;
      activeUsers.set(socket.id, { userId, userName });
      userRooms.set(userId, new Set());
      socket.join(userId);
      io.emit("user_connected", userId);
      io.emit("active_users", Array.from(activeUsers.values()));
    });

    socket.on("private_message", async (data) => {
      const { to, message, from, tempId } = data;

      try {
        const newMessage = await Message.create({
          sender: from,
          recipient: to,
          content: message,
          type: "private",
        });

        io.to(to).emit("private_message", {
          message: newMessage,
          from,
        });
        socket.emit("private_message", {
          message: newMessage,
          to,
          tempId,
        });
      } catch (error) {
        console.error("Error saving private message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("voice_offer", (data) => {
      const { offer, opponentId } = data;
      socket.to(opponentId).emit("voice_offer", {
        offer,
        from: socket.id,
      });
    });

    socket.on("voice_answer", (data) => {
      const { answer, opponentId } = data;
      socket.to(opponentId).emit("voice_answer", {
        answer,
        from: socket.id,
      });
    });

    socket.on("voice_candidate", (data) => {
      const { candidate, opponentId } = data;
      socket.to(opponentId).emit("voice_candidate", {
        candidate,
        from: socket.id,
      });
    });

    socket.on("game_state_update", (data) => {
      const { roomId, gameState, from } = data;
      socket.to(roomId).emit("opponent_game_state", {
        gameState,
        from,
      });
    });

    socket.on("arena_join", async (data) => {
      const { userId, userName, opponentId } = data;

      try {
        const notification = await Notification.create({
          recipient: opponentId,
          sender: userId,
          type: "arena_join",
          message: `${userName} has entered the arena`,
          metadata: {
            type: "arena_join",
            userId: userId,
            userName: userName,
          },
        });

        io.to(opponentId).emit("newNotification", notification);
        const message = await Message.create({
          sender: userId,
          recipient: opponentId,
          content: `${userName} has entered the arena`,
          type: "private"
        });

        io.to(opponentId).emit("private_message", {
          message,
          from: userId,
        });
      } catch (error) {
        console.error("Error sending arena join notification:", error);
        socket.emit("error", {
          message: "Failed to send arena join notification",
        });
      }
    });

    socket.on("group_message", async (data) => {
      const { roomId, message, from, tempId } = data;

      try {
        const newMessage = await Message.create({
          sender: from,
          roomId,
          content: message,
          type: "group",
        });

        io.to(roomId).emit("group_message", {
          roomId,
          message: newMessage,
          from,
          tempId,
        });
      } catch (error) {
        console.error("Error saving group message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });
    socket.on("join_room", async (data) => {
      const { roomId, userId } = data;

      try {
        const room = await ChatRoom.findOne({
          _id: roomId,
          expiresAt: { $gt: new Date() },
        });

        if (!room) {
          socket.emit("room_expired", { roomId });
          return;
        }

        if (room.type === "private" && !room.members.includes(userId)) {
          socket.emit("error", { message: "Not authorized to join this room" });
          return;
        }

        const userRoomSet = userRooms.get(userId) || new Set();
        userRoomSet.add(roomId);
        userRooms.set(userId, userRoomSet);

        socket.join(roomId);

        const messages = await Message.find({
          roomId,
          type: "group",
        })
          .sort({ createdAt: -1 })
          .limit(50);

        socket.emit("room_joined", {
          roomId,
          messages: messages.reverse(),
          expiresAt: room.expiresAt,
        });

        socket.to(roomId).emit("user_joined_room", {
          userId,
          userName: activeUsers.get(socket.id)?.userName,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave_room", async (data) => {
      const { roomId, userId } = data;

      if (userId && roomId) {
        const userRoomSet = userRooms.get(userId);
        if (userRoomSet) {
          userRoomSet.delete(roomId);
        }

        socket.leave(roomId);

        socket.to(roomId).emit("user_left_room", {
          userId,
          userName: activeUsers.get(socket.id)?.userName,
        });
      }
    });

    socket.on("check_room_expiration", async (roomId) => {
      try {
        if (await isRoomExpired(roomId)) {
          socket.emit("room_expired", { roomId });
        }
      } catch (error) {
        console.error("Error checking room expiration:", error);
      }
    });

    socket.on("typing_start", (data) => {
      const { roomId, userId, userName } = data;
      socket.to(roomId).emit("user_typing", { userId, userName });
    });

    socket.on("player_ready", (data) => {
      const { playerId, opponentId } = data;
      socket.to(opponentId).emit("player_ready", {
        playerId,
      });
    });

    socket.on("game_start", (data) => {
      const { opponentId } = data;
      socket.to(opponentId).emit("game_start");
    });

    socket.on("typing_stop", (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit("user_stopped_typing", { userId });
    });

    socket.on("initiate_call", async (data) => {
      const { opponentId } = data;
      socket.to(opponentId).emit("call_initiated", {
        from: socket.id
      });
    });

    socket.on("call_initiated", async (data) => {
      socket.emit("auto_start_call", {
        opponentId: data.from
      });
    });

    socket.on("mark_messages_read", async (data) => {
      const { messageIds, userId } = data;

      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            recipient: userId,
            read: false,
          },
          { read: true }
        );

        const messages = await Message.find({ _id: { $in: messageIds } });
        messages.forEach((msg) => {
          io.to(msg.sender).emit("message_read", {
            messageId: msg._id,
            readBy: userId,
          });
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    socket.on("sendChallenge", async (data) => {
      try {
        const { senderId, recipientId, challengeType, message } = data;

        const notification = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: "challenge",
          message,
          metadata: { challengeType },
        });

        const recipientSocketId = userSockets.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("newNotification", notification);
        }
      } catch (error) {
        console.error("Error sending challenge:", error);
      }
    });

    socket.on("disconnect", () => {
      const userData = activeUsers.get(socket.id);

      if (userData) {
        const userRoomSet = userRooms.get(userData.userId);
        if (userRoomSet) {
          userRoomSet.forEach((roomId) => {
            socket.to(roomId).emit("user_left_room", {
              userId: userData.userId,
              userName: userData.userName,
            });
          });
          userRooms.delete(userData.userId);
        }

        io.emit("user_disconnected", userData.userId);

        activeUsers.delete(socket.id);
        io.emit("active_users", Array.from(activeUsers.values()));
      }

      console.log("User disconnected:", socket.id);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
      socket.emit("error", { message: "An unexpected error occurred" });
    });
  });

  setInterval(async () => {
    try {
      const expiredRooms = await ChatRoom.find({
        expiresAt: { $lte: new Date() },
      });

      for (const room of expiredRooms) {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            await Message.deleteMany(
              {
                roomId: room._id,
                type: "group",
              },
              { session }
            );

            await ChatRoom.deleteOne({ _id: room._id }, { session });

            io.to(room._id.toString()).emit("room_expired", {
              roomId: room._id,
            });
            io.in(room._id.toString()).socketsLeave(room._id.toString());
          });
        } catch (error) {
          console.error("Error during room cleanup:", error);
        } finally {
          session.endSession();
        }
      }
    } catch (error) {
      console.error("Error in periodic room expiration check:", error);
    }
  }, 60 * 1000);

  return io;
}

module.exports = initializeSocket;
