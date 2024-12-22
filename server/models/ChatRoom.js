const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  joinCode: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  members: [{
    type: String,
    ref: 'User'
  }],
  admins: [{
    type: String,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours from creation
  }
}, {
  timestamps: true
});

// Index for expiration and members
chatRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
chatRoomSchema.index({ members: 1 });

// Pre-delete middleware to clean up associated messages
chatRoomSchema.pre('remove', async function(next) {
  try {
    await mongoose.model('Message').deleteMany({
      roomId: this._id,
      type: 'group'
    });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);