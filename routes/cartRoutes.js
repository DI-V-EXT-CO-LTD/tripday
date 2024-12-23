const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Get cart items
router.get('/', ensureAuthenticated, cartController.getCart);

// Add item to cart
router.post('/add', ensureAuthenticated, cartController.addToCart);

// Add golf to cart
router.post('/addGolf/:golfId', ensureAuthenticated, cartController.addGolfToCart);

// Add golf to cart
router.post('/addPackage/:packageId', ensureAuthenticated, cartController.addPackageToCart);

// Remove item from cart
router.post('/remove/:itemId', ensureAuthenticated, cartController.removeFromCart);

// Update item quantity
router.put('/update/:itemId', ensureAuthenticated, cartController.updateQuantity);

// Get cart count
router.get('/count', ensureAuthenticated, cartController.getCartCount);

module.exports = router;