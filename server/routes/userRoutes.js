const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, handleAuthError } = require('../middleware/auth');

router.post('/', authMiddleware, userController.createOrUpdateUser);
router.get('/:auth0Id', authMiddleware, userController.getUser);
router.put('/:auth0Id/profile', authMiddleware, userController.updateUserProfile);
router.get('/', authMiddleware, userController.getAllUsers);

router.use(handleAuthError);

module.exports = router;