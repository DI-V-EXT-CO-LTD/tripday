const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { ensureAuthenticated, ensureVerified } = require('../config/auth');

router.get('/', ensureAuthenticated, ensureVerified, dashboardController.getDashboard);
router.post('/checkout', ensureAuthenticated, ensureVerified, dashboardController.postCheckout);
router.get('/payment', ensureAuthenticated, ensureVerified, dashboardController.renderPaymentPage);
router.post('/payment', ensureAuthenticated, ensureVerified, dashboardController.processPayment);
router.post('/accept-payment', ensureAuthenticated, ensureVerified, dashboardController.acceptPayment);
router.post('/cart/update-selected', ensureAuthenticated, ensureVerified, dashboardController.updateSelectedItems);
router.get('/get-selected-items', ensureAuthenticated, ensureVerified, dashboardController.getSelectedItems);
router.get('/purchases', ensureAuthenticated, ensureVerified, dashboardController.getPurchases);

module.exports = router;