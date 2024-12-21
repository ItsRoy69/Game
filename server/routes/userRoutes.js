const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, handleAuthError } = require('../middleware/auth');

router.post('/', authMiddleware, userController.createOrUpdateUser);
router.patch('/:auth0Id', authMiddleware, userController.updateLastLogin);
router.get('/:auth0Id', authMiddleware, userController.getUser);

router.use(handleAuthError);

module.exports = router;