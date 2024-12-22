const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware, handleAuthError, extractUser } = require('../middleware/auth');

// Define debug middleware
const debugMiddleware = (req, res, next) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  next();
};

// Add middlewares in the correct order
router.use(debugMiddleware);
router.use(authMiddleware);
router.use(extractUser);

// Your existing routes
router.post('/rooms', chatController.createRoom);
router.get('/rooms', chatController.getRooms);  // Note: Added missing getRooms route
router.get('/rooms/:roomId', chatController.getRoomDetails);
router.put('/rooms/:roomId', chatController.updateRoom);
router.delete('/rooms/:roomId', chatController.deleteRoom);

router.get('/messages/private/:userId', chatController.getPrivateMessages);
router.get('/messages/room/:roomId', chatController.getRoomMessages);

router.use(handleAuthError);

module.exports = router;