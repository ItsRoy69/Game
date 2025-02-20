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
    default: () => new Date(Date.now() + 5 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});

chatRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
chatRoomSchema.index({ members: 1 });

chatRoomSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
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