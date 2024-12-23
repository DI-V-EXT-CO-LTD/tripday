const express = require('express');
const router = express.Router();
const customerServiceController = require('../controllers/customerServiceController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/', ensureAuthenticated, customerServiceController.getCustomerServicePage);
router.post('/send', ensureAuthenticated, customerServiceController.sendMessage);

module.exports = router;