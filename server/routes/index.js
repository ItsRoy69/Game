const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes');
const notificationRoutes = require('./notificationRoutes');
const challengeRoutes = require('./challengeRoutes');

router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/challenges', challengeRoutes);

module.exports = router;