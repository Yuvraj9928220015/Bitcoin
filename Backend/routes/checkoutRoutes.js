// routes/checkoutRoutes.js

const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

// POST /api/payment - Endpoint to handle placing an order and payment processing
router.post('/payment', checkoutController.placeOrder);

// GET /api/orders - Optional: Get all orders (e.g., for an admin dashboard)
router.get('/orders', checkoutController.getAllOrders);

// GET /api/orders/:id - Optional: Get a single order by ID
router.get('/orders/:id', checkoutController.getOrderById);

module.exports = router;