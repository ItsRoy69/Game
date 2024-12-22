const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  sender: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }, 
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);