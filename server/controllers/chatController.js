const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const chatController = {
  async createRoom(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const { name, description, type, members } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Room name is required",
        });
      }

      if (type && !["public", "private"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room type. Must be 'public' or 'private'",
        });
      }

      const room = await ChatRoom.create({
        name,
        description: description || "",
        type: type || "public",
        members: [...new Set([...(members || []), req.user.auth0Id])],
        admins: [req.user.auth0Id],
      });

      res.status(201).json({
        success: true,
        message: "Chat room created successfully",
        data: room,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A room with this name already exists",
        });
      }
      next(error);
    }
  },

  async getRooms(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const query = {
        $or: [{ type: "public" }, { members: req.user.auth0Id }],
      };

      if (req.query.search) {
        query.$or.push({
          name: new RegExp(req.query.search, "i"),
        });
      }

      const rooms = await ChatRoom.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ChatRoom.countDocuments(query);

      res.json({
        success: true,
        data: {
          rooms,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRooms: total,
            hasMore: total > skip + rooms.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomDetails(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      if (!isValidObjectId(req.params.roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format",
        });
      }

      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (room.type === "private" && !room.members.includes(req.user.auth0Id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this room",
        });
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRoom(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      if (!isValidObjectId(req.params.roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format",
        });
      }

      const { name, description, type, members } = req.body;
      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (!room.admins.includes(req.user.auth0Id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this room",
        });
      }

      if (type && !["public", "private"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room type. Must be 'public' or 'private'",
        });
      }

      const updatedRoom = await ChatRoom.findByIdAndUpdate(
        req.params.roomId,
        {
          ...(name && { name }),
          ...(description && { description }),
          ...(type && { type }),
          ...(members && { members }),
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({
        success: true,
        message: "Room updated successfully",
        data: updatedRoom,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A room with this name already exists",
        });
      }
      next(error);
    }
  },

  async deleteRoom(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      if (!isValidObjectId(req.params.roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format",
        });
      }

      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (!room.admins.includes(req.user.auth0Id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this room",
        });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await Message.deleteMany(
          {
            roomId: req.params.roomId,
            type: "group",
          },
          { session }
        );
        await ChatRoom.findByIdAndDelete(req.params.roomId, { session });

        await session.commitTransaction();

        res.json({
          success: true,
          message: "Room and associated messages deleted successfully",
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      next(error);
    }
  },

  async getPrivateMessages(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const dateFilter = {};
      if (req.query.startDate) {
        dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
      }
      if (req.query.endDate) {
        dateFilter.createdAt = {
          ...dateFilter.createdAt,
          $lte: new Date(req.query.endDate),
        };
      }

      const messages = await Message.find({
        type: "private",
        $or: [
          { sender: req.user.auth0Id, recipient: req.params.userId },
          { sender: req.params.userId, recipient: req.user.auth0Id },
        ],
        ...dateFilter,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments({
        type: "private",
        $or: [
          { sender: req.user.auth0Id, recipient: req.params.userId },
          { sender: req.params.userId, recipient: req.user.auth0Id },
        ],
        ...dateFilter,
      });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalMessages: total,
            hasMore: total > skip + messages.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomMessages(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      if (!isValidObjectId(req.params.roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format",
        });
      }

      const room = await ChatRoom.findById(req.params.roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (room.type === "private" && !room.members.includes(req.user.auth0Id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view messages in this room",
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const dateFilter = {};
      if (req.query.startDate) {
        dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
      }
      if (req.query.endDate) {
        dateFilter.createdAt = {
          ...dateFilter.createdAt,
          $lte: new Date(req.query.endDate),
        };
      }

      const messages = await Message.find({
        roomId: req.params.roomId,
        type: "group",
        ...dateFilter,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments({
        roomId: req.params.roomId,
        type: "group",
        ...dateFilter,
      });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalMessages: total,
            hasMore: total > skip + messages.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async markMessagesAsRead(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const { messageIds } = req.body;

      if (!Array.isArray(messageIds)) {
        return res.status(400).json({
          success: false,
          message: "messageIds must be an array",
        });
      }

      if (!messageIds.every((id) => isValidObjectId(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID format",
        });
      }

      await Message.updateMany(
        {
          _id: { $in: messageIds },
          recipient: req.user.auth0Id,
          read: false,
        },
        {
          $set: { read: true },
        }
      );

      res.json({
        success: true,
        message: "Messages marked as read successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadMessageCount(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const unreadCount = await Message.countDocuments({
        recipient: req.user.auth0Id,
        read: false,
      });

      res.json({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;