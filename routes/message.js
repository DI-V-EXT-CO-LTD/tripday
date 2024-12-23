const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { ensureAuthenticated } = require('../config/auth');

router.post('/send', ensureAuthenticated, messageController.sendMessage);
router.get('/', ensureAuthenticated, messageController.getMessages);
router.put('/:id/read', ensureAuthenticated, messageController.markMessageAsRead);

module.exports = router;