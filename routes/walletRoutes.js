const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/', walletController.getWallet);
router.post('/deposit', walletController.deposit);
router.post('/withdraw', walletController.withdraw);

module.exports = router;