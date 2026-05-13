// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const speedController = require('../controllers/speedController');

// ─── Stripe Payment ───
// POST /api/payment  →  Place order & charge via Stripe
router.post('/payment', checkoutController.placeOrder);

// ─── Speed (Bitcoin Lightning) Payment ───
// POST /api/speed/payment       →  Create Lightning invoice & save pending order
router.post('/speed/payment', speedController.createSpeedPayment);

// GET  /api/speed/payment/:paymentId/status  →  Poll payment status
router.get('/speed/payment/:paymentId/status', speedController.checkSpeedPaymentStatus);

// POST /api/speed/webhook  →  Speed webhook (called by Speed servers on payment)
router.post('/speed/webhook', speedController.speedWebhook);

// ─── Orders (Admin / Dashboard) ───
// GET  /api/orders          →  All orders
router.get('/orders', checkoutController.getAllOrders);

// GET  /api/orders/:id      →  Single order by ID
router.get('/orders/:id', checkoutController.getOrderById);

module.exports = router;