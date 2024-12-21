const User = require('../models/User');

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
      const updateData = {
        ...req.body,
        updated_at: new Date()
      };

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

  async deleteUser(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const user = await User.findOneAndDelete({ auth0Id });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

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

      const stats = {
        totalLogins: user.login_count || 0,
        lastLogin: user.last_login,
        accountCreated: user.created_at,
        lastUpdated: user.updated_at,
        loginHistory: user.login_history || [],
        emailVerified: user.email_verified
      };

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