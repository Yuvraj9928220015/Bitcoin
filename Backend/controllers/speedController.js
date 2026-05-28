const axios = require('axios');
const https = require('https');
const Order = require('../models/Order');
const Coupon = require('../models/CouponModel');

const SPEED_API_URL = 'https://api.tryspeed.com';
const SPEED_API_KEY = process.env.SPEED_API_KEY;

exports.createSpeedPayment = async (req, res) => {
    try {
        const { amount, browserId, items, customerInfo, note, appliedCoupons } = req.body;

        console.log("🚀 SPEED API ROUTE HIT");

        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty.' });
        if (!customerInfo) return res.status(400).json({ success: false, message: 'Customer info required.' });

        // Coupon calculation
        let serverCalculatedSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
        const originalSubtotal = serverCalculatedSubtotal;
        let totalDiscountAmount = 0;
        const appliedValidCoupons = [];

        if (appliedCoupons?.length > 0) {
            const couponDocs = await Coupon.find({
                code: { $in: appliedCoupons.map(c => c.toUpperCase()) },
                isActive: true
            });
            for (const coupon of couponDocs) {
                let discount = coupon.discountType === 'percentage'
                    ? (serverCalculatedSubtotal * coupon.discountValue) / 100
                    : coupon.discountValue;
                discount = Math.min(discount, serverCalculatedSubtotal);
                totalDiscountAmount += discount;
                serverCalculatedSubtotal -= discount;
                appliedValidCoupons.push({
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    discountAmount: discount
                });
            }
        }

        const finalTotal = serverCalculatedSubtotal;
        // Speed amount in cents
       const amountInCents = Math.round(finalTotal);

        console.log(`⚡ Creating Speed payment: $${finalTotal.toFixed(2)}`);

        // CORRECT payload
        const speedResponse = await axios.post(
            `${SPEED_API_URL}/checkout-sessions`,
            {
                amount: amountInCents,
                currency: 'USD',
                target_currency: 'SATS',
                payment_methods: ['lightning'],
                description: `Order - ${customerInfo.firstName} ${customerInfo.lastName}`
            },
            {
                auth: {
                    username: SPEED_API_KEY,
                    password: ''
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        const speedPayment = speedResponse.data;
        console.log('✅ SPEED RESPONSE:', speedPayment.id);

        // Save order
        const orderNumber = `ORD-${Date.now()}`;
        const newOrder = new Order({
            customerInfo,
            items,
            subtotal: originalSubtotal,
            discountAmount: totalDiscountAmount,
            finalTotal,
            note: note || '',
            paymentMethod: 'bitcoin_lightning',
            paymentStatus: 'pending',
            speedPaymentId: speedPayment.id,
            couponUsed: appliedValidCoupons.map(c => c.code).join(', ') || null,
            appliedDiscountsDetails: appliedValidCoupons,
            shippingDetails: {
                country: customerInfo.country || 'US',
                state: customerInfo.state,
                city: customerInfo.city,
                zip: customerInfo.zip
            },
            orderNumber
        });

        await newOrder.save();

        return res.status(200).json({
            success: true,
            paymentId: speedPayment.id,
            orderId: newOrder._id,
            orderNumber,
            amount: finalTotal,
            ttl: speedPayment.ttl || 600,
            // ✅ Checkout URL — user yahan se pay karega
            checkoutUrl: speedPayment.url,
            lightningInvoice: null // baad mein payments array se milega
        });

    } catch (error) {
        console.error("❌ STATUS:", error.response?.status);
        console.error("❌ DATA:", JSON.stringify(error.response?.data, null, 2));
        return res.status(400).json({
            success: false,
            message: error.response?.data?.errors?.[0]?.message || error.message
        });
    }
};

// CHECK PAYMENT STATUS
exports.checkSpeedPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const speedResponse = await axios.get(
            `${SPEED_API_URL}/checkout-sessions/${paymentId}`,
            {
                auth: { username: SPEED_API_KEY, password: '' },
                headers: { 'Accept': 'application/json' }
            }
        );
        const speedPayment = speedResponse.data;
        return res.status(200).json({
            success: true,
            status: speedPayment.status,
            isPaid: speedPayment.status === 'paid'
        });
    } catch (error) {
        console.error('❌ Speed status error:', error.response?.data || error.message);
        return res.status(400).json({
            success: false,
            message: error.response?.data?.errors?.[0]?.message || 'Failed to check payment status'
        });
    }
};

// WEBHOOK
exports.speedWebhook = async (req, res) => {
    return res.status(200).json({ received: true });
};