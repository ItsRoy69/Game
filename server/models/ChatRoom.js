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
  }]
}, {
  timestamps: true
});

chatRoomSchema.index({ members: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);