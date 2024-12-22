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

      const stats = {
        totalLogins: user.login_count || 0,
        lastLogin: user.last_login,
        accountCreated: user.created_at,
        lastUpdated: user.updated_at,
        loginHistory: user.login_history || [],
        emailVerified: user.email_verified,
        totalPhotos: user.photos ? user.photos.length : 0,
        storageUsed: user.photos ? user.photos.length : 0
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
  },

  async uploadSinglePhoto(req, res, next) {
    try {
      const { auth0Id } = req.params;
      const { photo } = req.body;

      if (!photo) {
        const error = new Error('No photo provided');
        error.status = 400;
        throw error;
      }

      try {
        const uploadedUrl = await appwriteUpload.saveImage(photo);

        const user = await User.findOneAndUpdate(
          { auth0Id },
          {
            $push: { photos: uploadedUrl },
            updated_at: new Date()
          },
          { new: true }
        );

        if (!user) {
          const error = new Error('User not found');
          error.status = 404;
          throw error;
        }

        res.json({
          message: 'Photo uploaded successfully',
          photoUrl: uploadedUrl,
          user
        });
      } catch (error) {
        console.error('Error uploading photo:', error);
        const err = new Error('Failed to upload photo');
        err.status = 500;
        throw err;
      }
    } catch (error) {
      next(error);
    }
  },

  async deleteSinglePhoto(req, res, next) {
    try {
      const { auth0Id, photoUrl } = req.params;

      const user = await User.findOne({ auth0Id });

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (!user.photos.includes(photoUrl)) {
        const error = new Error('Photo not found for this user');
        error.status = 404;
        throw error;
      }

      await appwriteUpload.deleteImage(photoUrl);

      const updatedUser = await User.findOneAndUpdate(
        { auth0Id },
        {
          $pull: { photos: photoUrl },
          updated_at: new Date()
        },
        { new: true }
      );

      res.json({
        message: 'Photo deleted successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;