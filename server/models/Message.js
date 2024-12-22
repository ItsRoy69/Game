const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    ref: 'User'
  },
  recipient: {
    type: String,
    ref: 'User'
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ roomId: 1, type: 1 });
messageSchema.index({ sender: 1, recipient: 1 });

module.exports = mongoose.model('Message', messageSchema);