const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

const chatController = {
  async createRoom(req, res, next) {
    try {
      const { name, description, type, members } = req.body;
      const room = await ChatRoom.create({
        name,
        description,
        type,
        members: [...members, req.user.auth0Id],
        admins: [req.user.auth0Id],
      });
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  },

  async getRooms(req, res, next) {
    try {
      const rooms = await ChatRoom.find({
        $or: [{ type: "public" }, { members: req.user.auth0Id }],
      });
      res.json(rooms);
    } catch (error) {
      next(error);
    }
  },

  async getRoomDetails(req, res, next) {
    try {
      const room = await ChatRoom.findById(req.params.roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      next(error);
    }
  },

  async updateRoom(req, res, next) {
    try {
      const { name, description, type, members } = req.body;
      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.admins.includes(req.user.auth0Id)) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this room" });
      }

      const updatedRoom = await ChatRoom.findByIdAndUpdate(
        req.params.roomId,
        {
          name,
          description,
          type,
          members,
        },
        { new: true }
      );

      res.json(updatedRoom);
    } catch (error) {
      next(error);
    }
  },

  async deleteRoom(req, res, next) {
    try {
      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.admins.includes(req.user.auth0Id)) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this room" });
      }

      await Message.deleteMany({ roomId: req.params.roomId, type: "group" });

      await ChatRoom.findByIdAndDelete(req.params.roomId);

      res.json({
        message: "Room and associated messages deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async getPrivateMessages(req, res, next) {
    try {
      const messages = await Message.find({
        type: "private",
        $or: [
          { sender: req.user.auth0Id, recipient: req.params.userId },
          { sender: req.params.userId, recipient: req.user.auth0Id },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(messages.reverse());
    } catch (error) {
      next(error);
    }
  },

  async getRoomMessages(req, res, next) {
    try {
      const messages = await Message.find({
        roomId: req.params.roomId,
        type: "group",
      })
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(messages.reverse());
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;
