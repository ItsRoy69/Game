const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.get('/:auth0Id', authMiddleware, notificationController.getNotifications);
router.put('/:notificationId/read', authMiddleware, notificationController.markAsRead);
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

module.exports = router;