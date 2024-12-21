const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const chatRoutes = require('./chatRoutes'); 

router.use('/users', userRoutes);
router.use('/chat', chatRoutes);  

module.exports = router;