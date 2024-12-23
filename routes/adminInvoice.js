const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 관리자 대시보드용 인보이스 라우트
router.get('/', adminController.getInvoices);

module.exports = router;