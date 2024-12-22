const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const crypto = require('crypto');

const generateJoinCode = () => {
  return crypto.randomBytes(4).toString('hex');
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanupService = {
  running: false,

  async cleanupMessages() {
    if (this.running) return;

    this.running = true;
    try {
      const expiredRooms = await ChatRoom.find({
        expiresAt: { $lte: new Date() }
      });

      for (const room of expiredRooms) {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          await Message.deleteMany({
            roomId: room._id,
            type: 'group'
          }, { session });

          await ChatRoom.findByIdAndDelete(room._id, { session });

          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error('Error during cleanup:', error);
        } finally {
          session.endSession();
        }
      }
    } catch (error) {
      console.error('Cleanup service error:', error);
    } finally {
      this.running = false;
    }
  },

  startPeriodicCleanup(interval = 60 * 60 * 1000) {
    setInterval(() => this.cleanupMessages(), interval);
  }
};

const chatController = {
  async createRoom(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const joinCode = generateJoinCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000);

      const room = await ChatRoom.create({
        name: `Room #${joinCode}`,
        type: req.body.type || "public",
        members: [req.user.auth0Id],
        admins: [req.user.auth0Id],
        joinCode,
        expiresAt
      });

      res.status(201).json({
        success: true,
        message: "Chat room created successfully",
        data: {
          ...room.toJSON(),
          expiresIn: '5 hours',
          expirationTime: expiresAt
        }
      });
    } catch (error) {
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
        expiresAt: { $gt: new Date() }
      };

      if (req.query.search) {
        query.name = new RegExp(req.query.search, "i");
      }

      const rooms = await ChatRoom.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await ChatRoom.countDocuments(query);

      const roomsWithExpiry = rooms.map(room => ({
        ...room.toJSON(),
        remainingTime: Math.max(0, room.expiresAt - new Date()) / 1000 / 60 / 60
      }));

      res.json({
        success: true,
        data: {
          rooms: roomsWithExpiry,
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

  async joinRoomByCode(req, res, next) {
    try {
      if (!req.user?.auth0Id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not authenticated",
        });
      }

      const { joinCode } = req.body;

      if (!joinCode) {
        return res.status(400).json({
          success: false,
          message: "Join code is required"
        });
      }

      const room = await ChatRoom.findOne({
        joinCode,
        expiresAt: { $gt: new Date() }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found or has expired"
        });
      }

      if (!room.members.includes(req.user.auth0Id)) {
        room.members.push(req.user.auth0Id);
        await room.save();
      }

      res.json({
        success: true,
        message: "Successfully joined room",
        data: {
          ...room.toJSON(),
          remainingTime: Math.max(0, room.expiresAt - new Date()) / 1000 / 60 / 60
        }
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

      const room = await ChatRoom.findOne({
        _id: req.params.roomId,
        expiresAt: { $gt: new Date() }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found or has expired",
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
        data: {
          ...room.toJSON(),
          remainingTime: Math.max(0, room.expiresAt - new Date()) / 1000 / 60 / 60
        }
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
      const room = await ChatRoom.findOne({
        _id: req.params.roomId,
        expiresAt: { $gt: new Date() }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found or has expired",
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
        data: {
          ...updatedRoom.toJSON(),
          remainingTime: Math.max(0, updatedRoom.expiresAt - new Date()) / 1000 / 60 / 60
        }
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

      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const query = {
        type: 'private',
        $or: [
          { sender: req.user.auth0Id, recipient: userId },
          { sender: userId, recipient: req.user.auth0Id }
        ]
      };

      if (req.query.startDate) {
        query.createdAt = { $gte: new Date(req.query.startDate) };
      }
      if (req.query.endDate) {
        query.createdAt = {
          ...query.createdAt,
          $lte: new Date(req.query.endDate)
        };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Message.countDocuments(query);

      if (messages.length > 0) {
        await Message.updateMany(
          {
            _id: { $in: messages.map(m => m._id) },
            recipient: req.user.auth0Id,
            read: false
          },
          { read: true }
        );
      }

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

      const room = await ChatRoom.findOne({
        _id: req.params.roomId,
        expiresAt: { $gt: new Date() }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found or has expired",
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
};

cleanupService.startPeriodicCleanup();

module.exports = chatController;