// routes/challengeRoutes.js
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, challengeController.createChallenge);
router.get('/:userId', authMiddleware, challengeController.getUserChallenges);
router.put('/:challengeId/status', authMiddleware, challengeController.updateChallengeStatus);

module.exports = router;