const mongoose = require('mongoose');

const gameScoreSchema = new mongoose.Schema({
  gameName: { type: String, required: true },
  highScore: { type: Number, default: 0 },
  lastPlayed: { type: Date, default: Date.now },
  totalGamesPlayed: { type: Number, default: 0 },
  scoreHistory: {
    type: [{
      score: Number,
      date: { type: Date, default: Date.now }
    }],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10']
  }
});

const userSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  picture: String,
  email_verified: Boolean,
  last_login: Date,
  login_count: { type: Number, default: 0 },
  login_history: {
    type: [Date],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10']
  },
  gameScores: {
    type: Map,
    of: gameScoreSchema,
    default: new Map()
  },
  gender: String,
  datingPreferences: [String],
  about: String,
  location: String,
  dateOfBirth: Date,
  occupation: {
    type: { type: String },
    details: String
  },
  photos: [String],
  favoriteGames: [String],
  preferredCartoons: [String],
  datingAgeRange: {
    min: { type: Number, default: 18 },
    max: { type: Number, default: 99 }
  },
  datingGoal: String,
  languagePreference: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

function arrayLimit(val) {
  return val.length <= 10;
}

userSchema.index({ email: 1 });
userSchema.index({ created_at: -1 });

userSchema.methods.getStats = function() {
  return {
    totalLogins: this.login_count || 0,
    lastLogin: this.last_login,
    accountCreated: this.created_at,
    lastUpdated: this.updated_at,
    loginHistory: this.login_history || [],
    emailVerified: this.email_verified,
    gameStats: Object.fromEntries(this.gameScores || new Map())
  };
};

module.exports = mongoose.model('User', userSchema);