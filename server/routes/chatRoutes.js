const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/rooms', chatController.createRoom);
router.get('/rooms', chatController.getRooms);
router.get('/rooms/:roomId', chatController.getRoomDetails);
router.put('/rooms/:roomId', chatController.updateRoom);
router.delete('/rooms/:roomId', chatController.deleteRoom);

router.get('/messages/private/:userId', chatController.getPrivateMessages);
router.get('/messages/room/:roomId', chatController.getRoomMessages);

module.exports = router;