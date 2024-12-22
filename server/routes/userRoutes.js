const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, handleAuthError } = require('../middleware/auth');

router.post('/', authMiddleware, userController.createOrUpdateUser);
router.get('/:auth0Id', authMiddleware, userController.getUser);
router.put('/:auth0Id/profile', authMiddleware, userController.updateUserProfile);
router.delete('/:auth0Id', authMiddleware, userController.deleteUser);
router.get('/', authMiddleware, userController.getAllUsers);

router.post('/:auth0Id/games/:gameName/score', authMiddleware, userController.updateGameScore);
router.get('/:auth0Id/games/:gameName/score', authMiddleware, userController.getGameScore);
router.get('/:auth0Id/games/scores', authMiddleware, userController.getAllGameScores);

router.get('/:auth0Id/stats', authMiddleware, userController.getUserStats);
router.get('/search', authMiddleware, userController.searchUsers);

router.use(handleAuthError);

module.exports = router;