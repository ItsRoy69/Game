const User = require('../models/User');

const userController = {
  async createOrUpdateUser(req, res, next) {
    try {
      const { auth0Id } = req.body;
      
      let user = await User.findOne({ auth0Id });
      
      if (user) {
        user = await User.findOneAndUpdate(
          { auth0Id },
          { ...req.body, updated_at: new Date() },
          { new: true }
        );
      } else {
        user = new User(req.body);
        await user.save();
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async updateLastLogin(req, res, next) {
    try {
      const user = await User.findOneAndUpdate(
        { auth0Id: req.params.auth0Id },
        { last_login: new Date(), updated_at: new Date() },
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
  }
};

module.exports = userController;