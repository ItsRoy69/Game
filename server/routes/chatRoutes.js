const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware, handleAuthError, extractUser } = require('../middleware/auth');

const debugMiddleware = (req, res, next) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  next();
};

router.use(debugMiddleware);
router.use(authMiddleware);
router.use(extractUser);

router.post('/rooms', chatController.createRoom);
router.get('/rooms', chatController.getRooms);
router.get('/rooms/:roomId', chatController.getRoomDetails);
router.put('/rooms/:roomId', chatController.updateRoom);
router.delete('/rooms/:roomId', chatController.deleteRoom);
router.post('/join', chatController.joinRoomByCode);
router.get('/messages/private/:userId', chatController.getPrivateMessages);
router.get('/messages/room/:roomId', chatController.getRoomMessages);

router.use(handleAuthError);

module.exports = router;
