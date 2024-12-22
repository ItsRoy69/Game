// models/Challenge.js
const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  challengerId: { type: String, required: true },
  challengedId: { type: String, required: true },
  gameId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

module.exports = mongoose.model('Challenge', challengeSchema);