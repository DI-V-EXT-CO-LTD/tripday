const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

router.get('/terms', aboutController.getTerms);
router.get('/privacy-policy', aboutController.getPrivacy);
router.get('/service-gurantee', aboutController.getServiceGurantee);
router.get('/more-service-info', aboutController.getMoreServiceInfo);
router.get('/cancel-refund-policy', aboutController.getCancelRefundPolicy);

module.exports = router;