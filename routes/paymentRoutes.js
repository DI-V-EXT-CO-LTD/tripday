const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create payment intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// Create purchase
router.post('/create-purchase', paymentController.createPurchase);

// Webhooks
router.post('/webhook/stripe', paymentController.handleWebhook);
router.post('/webhook/paypal', paymentController.handleWebhook);
router.post('/webhook/omise', paymentController.handleWebhook);

module.exports = router;