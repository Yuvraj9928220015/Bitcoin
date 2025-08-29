const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

const ensureSession = (req, res, next) => {
    if (!req.session) {
        return res.status(500).json({ message: 'Session not available' });
    }

    req.deviceInfo = {
        userAgent: req.headers['user-agent'] || '',
        platform: req.headers['sec-ch-ua-platform'] || '',
        language: req.headers['accept-language'] || ''
    };

    next();
};

const logCartActivity = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] Cart API: ${req.method} ${req.path}`);
        console.log('User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');
        console.log('Browser ID Header:', req.headers['x-browser-id']);
    }
    next();
};

router.use(ensureSession);
router.use(logCartActivity);

// Browser info route
router.get('/browser-info', cartController.getBrowserInfo);

// Get cart items
router.get('/', cartController.getCartItems);

// Add item to cart
router.post('/add', cartController.addItemToCart);

// Update item quantity
router.put('/update/:cartItemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:cartItemId', cartController.removeCartItem);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Sync cart between frontend and backend
router.post('/sync', cartController.syncCart);

module.exports = router;