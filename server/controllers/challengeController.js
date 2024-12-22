// controllers/challengeController.js
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Notification = require('../models/Notification');

const challengeController = {
  async createChallenge(req, res, next) {
    try {
      const { challengerId, challengedId, gameId } = req.body;
      
      // Validate users exist
      const [challenger, challenged] = await Promise.all([
        User.findOne({ auth0Id: challengerId }),
        User.findOne({ auth0Id: challengedId })
      ]);

      if (!challenger || !challenged) {
        const error = new Error('One or both users not found');
        error.status = 404;
        throw error;
      }

      // Check if there's already a pending challenge
      const existingChallenge = await Challenge.findOne({
        challengerId,
        challengedId,
        gameId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (existingChallenge) {
        const error = new Error('A pending challenge already exists');
        error.status = 409;
        throw error;
      }

      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const challenge = await Challenge.create({
        challengerId,
        challengedId,
        gameId,
        expiresAt
      });

      // Create notification for challenged user
      await Notification.create({
        recipient: challengedId,
        sender: challengerId,
        type: 'challenge',
        message: `You've received a new game challenge from ${challenger.name}!`,
        metadata: { 
          challengeId: challenge._id,
          gameId: gameId
        }
      });

      res.status(201).json(challenge);
    } catch (error) {
      next(error);
    }
  },

  async getUserChallenges(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, role } = req.query;

      let query = {
        $or: [{ challengerId: userId }, { challengedId: userId }]
      };

      // Filter by status if provided
      if (status) {
        query.status = status;
      }

      // Filter by role if provided (challenger or challenged)
      if (role === 'challenger') {
        query = { challengerId: userId };
      } else if (role === 'challenged') {
        query = { challengedId: userId };
      }

      // Only get non-expired challenges or completed ones
      query.$or = [
        { status: 'completed' },
        { expiresAt: { $gt: new Date() } }
      ];

      const challenges = await Challenge.find(query)
        .sort({ createdAt: -1 })
        .limit(50);

      res.json(challenges);
    } catch (error) {
      next(error);
    }
  },

  async updateChallengeStatus(req, res, next) {
    try {
      const { challengeId } = req.params;
      const { status, userId } = req.body;

      const challenge = await Challenge.findById(challengeId);

      if (!challenge) {
        const error = new Error('Challenge not found');
        error.status = 404;
        throw error;
      }

      // Verify the user has permission to update this challenge
      if (challenge.challengedId !== userId) {
        const error = new Error('Unauthorized to update this challenge');
        error.status = 403;
        throw error;
      }

      // Verify challenge hasn't expired
      if (challenge.expiresAt < new Date() && status !== 'expired') {
        const error = new Error('Challenge has expired');
        error.status = 400;
        throw error;
      }

      challenge.status = status;
      await challenge.save();

      // Create notification for challenger
      const challenger = await User.findOne({ auth0Id: challenge.challengerId });
      const challenged = await User.findOne({ auth0Id: challenge.challengedId });

      let notificationMessage;
      switch (status) {
        case 'accepted':
          notificationMessage = `${challenged.name} accepted your challenge!`;
          break;
        case 'rejected':
          notificationMessage = `${challenged.name} declined your challenge.`;
          break;
        case 'completed':
          notificationMessage = `Your challenge with ${challenged.name} has been completed.`;
          break;
      }

      if (notificationMessage) {
        await Notification.create({
          recipient: challenge.challengerId,
          sender: challenge.challengedId,
          type: 'challenge_update',
          message: notificationMessage,
          metadata: {
            challengeId: challenge._id,
            gameId: challenge.gameId,
            status
          }
        });
      }

      res.json(challenge);
    } catch (error) {
      next(error);
    }
  },

  async deleteChallenges(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Delete expired challenges
      const result = await Challenge.deleteMany({
        $or: [
          { challengerId: userId },
          { challengedId: userId }
        ],
        expiresAt: { $lt: new Date() },
        status: { $ne: 'completed' }
      });

      res.json({
        message: 'Expired challenges deleted successfully',
        deletedCount: result.deletedCount
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = challengeController;