const express = require('express');
const router = express.Router();
const splitInvoiceController = require('../controllers/splitInvoiceController');

// Middleware to check if the user is an authenticated admin
const isAuthenticatedAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
        return next();
    }
    res.redirect('/'); // Redirect to login page if not authenticated or not an admin
};

// Apply the isAuthenticatedAdmin middleware to all split invoice routes
router.use(isAuthenticatedAdmin);

router.get('/:invoiceId', splitInvoiceController.showSplitInvoice);

module.exports = router;