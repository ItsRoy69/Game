const User = require('../models/User');
const appwriteUpload = require('../config/appwriteConfig');

const userController = {
  async createOrUpdateUser(req, res, next) {
    try {
      console.log('Received user data:', req.body);
      const { auth0Id } = req.body;

      const updateData = {
        ...req.body,
        updated_at: new Date(),
        last_login: new Date(),
        $inc: { login_count: 1 },
        $push: {
          login_history: {
            $each: [new Date()],
            $slice: -10
          }
        }
      };

      const user = await User.findOneAndUpdate(
        { auth0Id },
        updateData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      res.json(user);
    } catch (error) {
      if (error.code === 11000) {
        try {
          const user = await User.findOneAndUpdate(
            { auth0Id: req.body.auth0Id },
            updateData,
            { new: true }
          );
          return res.json(user);
        } catch (retryError) {
          return next(retryError);
        }
      }
      next(error);
    }
  },

  async getUser(req, res, next) {
    try {
      const user = await User.findOne({ auth0Id: req.params.auth0Id });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find({})
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      res.json({
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserProfile(req, res, next) {
    try {
      const { auth0Id } = req.params;
      let updateData = { ...req.body };

      if (updateData.photos) {
        try {
          const existingUser = await User.findOne({ auth0Id });

          if (existingUser && existingUser.photos) {
            for (const oldPhoto of existingUser.photos) {
              if (!updateData.photos.includes(oldPhoto)) {
                await appwriteUpload.deleteImage(oldPhoto);
              }
            }
          }

          const processedPhotos = await Promise.all(
            updateData.photos.map(async (photo) => {
              if (photo.includes('/storage/buckets/')) {
                return photo;
              }
              try {
                const uploadedUrl = await appwriteUpload.saveImage(photo);
                return uploadedUrl;
              } catch (error) {
                console.error('Error saving photo:', error);
                return null;
              }
            })
          );

          updateData.photos = processedPhotos.filter(photo => photo !== null);
        } catch (error) {
          console.error('Error processing photos:', error);
          const err = new Error('Failed to process photos');
          err.status = 500;
          throw err;
        }
      }

      updateData.updated_at = new Date();

      const user = await User.findOneAndUpdate(
        { auth0Id },
        updateData,
        { new: true }
      );

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async updateGameScore(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const { gameName, score } = req.body;

      if (!gameName || score === undefined) {
        const error = new Error('Game name and score are required');
        error.status = 400;
        throw error;
      }

      const user = await User.findOne({ auth0Id });
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (!user.gameScores) {
        user.gameScores = new Map();
      }

      const gameScore = user.gameScores.get(gameName) || {
        gameName: gameName,
        highScore: 0,
        totalGamesPlayed: 0,
        scoreHistory: [],
        lastPlayed: new Date()
      };

      gameScore.totalGamesPlayed += 1;
      gameScore.lastPlayed = new Date();

      if (score > gameScore.highScore) {
        gameScore.highScore = score;
      }

      gameScore.scoreHistory.push({
        score: score,
        date: new Date()
      });

      if (gameScore.scoreHistory.length > 10) {
        gameScore.scoreHistory = gameScore.scoreHistory.slice(-10);
      }
      user.gameScores.set(String(gameName), gameScore);
      await user.save();

      res.json({
        message: 'Game score updated successfully',
        gameScore
      });
    } catch (error) {
      next(error);
    }
  },

  async getGameScore(req, res, next) {
    try {
      const { auth0Id, gameName } = req.params;

      const user = await User.findOne({ auth0Id });
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      const gameScore = user.gameScores.get(String(gameName)) || {
        gameName,
        highScore: 0,
        totalGamesPlayed: 0,
        scoreHistory: []
      };

      res.json(gameScore);
    } catch (error) {
      next(error);
    }
  },

  async getAllGameScores(req, res, next) {
    try {
      const { auth0Id } = req.params;

      const user = await User.findOne({ auth0Id });
      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      const gameScores = Object.fromEntries(user.gameScores || new Map());

      res.json({
        auth0Id,
        gameScores
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const user = await User.findOne({ auth0Id });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (user.photos && user.photos.length > 0) {
        for (const photo of user.photos) {
          await appwriteUpload.deleteImage(photo);
        }
      }

      await User.findOneAndDelete({ auth0Id });

      res.json({ message: 'User deleted successfully', user });
    } catch (error) {
      next(error);
    }
  },

  async getUserStats(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const user = await User.findOne({ auth0Id });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      const stats = user.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  async searchUsers(req, res, next) {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const searchQuery = {
        $or: [
          { name: new RegExp(query, 'i') },
          { email: new RegExp(query, 'i') }
        ]
      };

      const users = await User.find(searchQuery)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(searchQuery);

      res.json({
        users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;