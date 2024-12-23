const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { ensureAuthenticated } = require('../config/auth');

router.get('/', ensureAuthenticated, voucherController.renderVouchersPage);
router.get('/api', ensureAuthenticated, voucherController.getVouchers);
router.post('/submit-voucher', ensureAuthenticated, voucherController.submitVoucher);

module.exports = router;