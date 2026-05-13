// controllers/speedController.js
const axios = require('axios');
const Order = require('../models/Order');
const Coupon = require('../models/CouponModel');

const SPEED_API_URL = 'https://api.tryspeed.com';
const SPEED_API_KEY = process.env.SPEED_API_KEY;

// Helper: Base64 encode API key for Basic Auth
const getAuthHeader = () => {
    const encoded = Buffer.from(`${SPEED_API_KEY}:`).toString('base64');
    return `Basic ${encoded}`;
};

// ─── Create Speed Payment (Lightning Invoice) ───
exports.createSpeedPayment = async (req, res) => {
    try {
        const {
            amount,
            browserId,
            items,
            customerInfo,
            note,
            appliedCoupons
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount.' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }
        if (!customerInfo) {
            return res.status(400).json({ success: false, message: 'Customer info required.' });
        }

        // ── Server-side price calculation ──
        let serverCalculatedSubtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        const originalSubtotal = serverCalculatedSubtotal;
        let totalDiscountAmount = 0;
        const appliedValidCoupons = [];

        // ── Coupon validation ──
        if (appliedCoupons && appliedCoupons.length > 0) {
            const couponDocs = await Coupon.find({
                code: { $in: appliedCoupons.map(c => c.toUpperCase()) },
                isActive: true
            });

            const percentageCoupons = couponDocs
                .filter(c => c.discountType === 'percentage')
                .sort((a, b) => b.discountValue - a.discountValue);
            const fixedCoupons = couponDocs
                .filter(c => c.discountType === 'fixed')
                .sort((a, b) => b.discountValue - a.discountValue);

            for (const coupon of [...percentageCoupons, ...fixedCoupons]) {
                const latestCoupon = await Coupon.findById(coupon._id);
                if (!latestCoupon) continue;
                if (latestCoupon.expiryDate && new Date() > latestCoupon.expiryDate) continue;
                if (latestCoupon.usageLimit && latestCoupon.usedCount >= latestCoupon.usageLimit) continue;
                if (serverCalculatedSubtotal < latestCoupon.minOrderAmount) continue;

                let currentCouponDiscount = 0;
                if (latestCoupon.discountType === 'percentage') {
                    currentCouponDiscount = (serverCalculatedSubtotal * latestCoupon.discountValue) / 100;
                    if (latestCoupon.maxDiscountAmount && currentCouponDiscount > latestCoupon.maxDiscountAmount) {
                        currentCouponDiscount = latestCoupon.maxDiscountAmount;
                    }
                } else if (latestCoupon.discountType === 'fixed') {
                    currentCouponDiscount = latestCoupon.discountValue;
                }

                currentCouponDiscount = Math.min(currentCouponDiscount, serverCalculatedSubtotal);

                if (currentCouponDiscount > 0) {
                    totalDiscountAmount += currentCouponDiscount;
                    serverCalculatedSubtotal -= currentCouponDiscount;
                    appliedValidCoupons.push({
                        code: latestCoupon.code,
                        discountType: latestCoupon.discountType,
                        discountValue: latestCoupon.discountValue,
                        discountAmount: currentCouponDiscount
                    });
                }
            }
        }

        const finalTotal = serverCalculatedSubtotal;
        console.log(` Creating Speed payment: $${finalTotal.toFixed(2)} USD`);

        // ── Call Speed API ──
        const speedResponse = await axios.post(
            `${SPEED_API_URL}/payments`,
            {
                amount: parseFloat(finalTotal.toFixed(2)),
                currency: 'USD',
                description: `Bitcoin Butik order by ${customerInfo.email}`,
                statement_descriptor: 'Thank you for buying at Bitcoin Butik',
                payment_methods: ['lightning'],
                metadata: {
                    CustomerID: browserId || 'unknown',
                    OrderID: `ORD-${Date.now()}`,
                    customerEmail: customerInfo.email,
                    customerName: `${customerInfo.firstName} ${customerInfo.lastName}`
                }
            },
            {
                headers: {
                    Authorization: getAuthHeader(),
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            }
        );

        const speedPayment = speedResponse.data;
        console.log(` Speed payment created: ${speedPayment.id}`);

        // ── Save pending order to DB ──
        const orderNumber = `ORD-${Date.now()}`;
        const newOrder = new Order({
            customerInfo,
            items: items.map(item => ({
                productId: item.productId || item.id,
                name: item.name,
                image: item.image,
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity),
                size: item.size || undefined
            })),
            subtotal: originalSubtotal,
            discountAmount: totalDiscountAmount,
            finalTotal,
            note: note || '',
            paymentMethod: 'bitcoin_lightning',
            paymentStatus: 'pending',
            stripeChargeId: null,
            speedPaymentId: speedPayment.id,
            couponUsed: appliedValidCoupons.map(c => c.code).join(', ') || null,
            appliedDiscountsDetails: appliedValidCoupons,
            shippingDetails: {
                country: customerInfo.country || 'US',
                state: customerInfo.state,
                city: customerInfo.city,
                zip: customerInfo.zip
            },
            createdAt: new Date(),
            orderNumber
        });

        await newOrder.save();
        console.log(` Pending Bitcoin order saved: ${newOrder._id}`);

        return res.status(200).json({
            success: true,
            paymentId: speedPayment.id,
            orderId: newOrder._id,
            orderNumber,
            amount: speedPayment.amount,
            currency: speedPayment.currency,
            targetAmount: speedPayment.target_amount,
            targetCurrency: speedPayment.target_currency,
            exchangeRate: speedPayment.exchange_rate,
            ttl: speedPayment.ttl,
            expiresAt: speedPayment.expires_at,
            lightningInvoice: speedPayment.payment_method_options?.lightning?.payment_request,
            lightningId: speedPayment.payment_method_options?.lightning?.id,
            status: speedPayment.status,
            appliedDiscounts: appliedValidCoupons
        });

    } catch (error) {
        console.error('❌ Speed Payment Error:', error.response?.data || error.message);
        return res.status(400).json({
            success: false,
            message: error.response?.data?.message || error.message || 'Bitcoin payment creation failed'
        });
    }
};

// ─── Check Speed Payment Status ────────────────────────────────────────────
exports.checkSpeedPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const speedResponse = await axios.get(
            `${SPEED_API_URL}/payments/${paymentId}`,
            {
                headers: {
                    Authorization: getAuthHeader(),
                    Accept: 'application/json'
                }
            }
        );

        const speedPayment = speedResponse.data;

        if (speedPayment.status === 'paid') {
            const order = await Order.findOneAndUpdate(
                { speedPaymentId: paymentId, paymentStatus: 'pending' },
                { paymentStatus: 'succeeded', updatedAt: new Date() },
                { new: true }
            );

            if (order) {
                for (const couponDetail of (order.appliedDiscountsDetails || [])) {
                    await Coupon.findOneAndUpdate(
                        { code: couponDetail.code },
                        { $inc: { usedCount: 1 } }
                    );
                }

                try {
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PASS
                        }
                    });

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: order.customerInfo.email,
                        cc: process.env.EMAIL_RECEIVER,
                        subject: `Order Confirmation - ${order.orderNumber}`,
                        html: `
                            <h2> Lightning Payment Confirmed!</h2>
                            <p>Dear ${order.customerInfo.firstName} ${order.customerInfo.lastName},</p>
                            <p>Thank you for your order!</p>
                            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                            <p><strong>Amount:</strong> $${order.finalTotal.toFixed(2)} USD</p>
                            <p><strong>Payment Method:</strong> Bitcoin Lightning</p>
                            <p><strong>Payment ID:</strong> ${paymentId}</p>
                            <p><strong>Status:</strong> Confirmed</p>
                            <br/>
                            <p>Thank you for buying at Bitcoin Butik!</p>
                        `
                    });
                    console.log(`Lightning payment email sent to ${order.customerInfo.email}`);
                } catch (emailError) {
                    console.error('Email error:', emailError.message);
                }
            }
        }

        return res.status(200).json({
            success: true,
            status: speedPayment.status,
            paymentId: speedPayment.id,
            amount: speedPayment.amount,
            currency: speedPayment.currency,
            targetAmount: speedPayment.target_amount,
            targetCurrency: speedPayment.target_currency,
            expiresAt: speedPayment.expires_at,
            isPaid: speedPayment.status === 'paid'
        });

    } catch (error) {
        console.error('❌ Speed status check error:', error.response?.data || error.message);
        return res.status(400).json({
            success: false,
            message: error.response?.data?.message || 'Failed to check payment status'
        });
    }
};

// ─── Speed Webhook Handler ─────────────────────────────────────────────────
exports.speedWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.SPEED_WEBHOOK_SECRET;

        if (webhookSecret) {
            const signature = req.headers['x-speed-signature'];
            const crypto = require('crypto');

            const rawBody = req.body instanceof Buffer
                ? req.body
                : Buffer.from(JSON.stringify(req.body));

            const expectedSig = crypto
                .createHmac('sha256', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (signature !== expectedSig) {
                console.warn('Invalid Speed webhook signature');
                return res.status(400).json({ success: false, message: 'Invalid signature' });
            }
        }

        const event = req.body instanceof Buffer
            ? JSON.parse(req.body.toString())
            : req.body;

        console.log(`Speed webhook received: ${event.type || 'unknown'}`);

        if (event.data?.status === 'paid' || event.type === 'payment.paid') {
            const paymentId = event.data?.id;
            if (paymentId) {
                const order = await Order.findOneAndUpdate(
                    { speedPaymentId: paymentId, paymentStatus: 'pending' },
                    { paymentStatus: 'succeeded', updatedAt: new Date() },
                    { new: true }
                );

                if (order) {
                    // Coupon usage increment
                    for (const couponDetail of (order.appliedDiscountsDetails || [])) {
                        await Coupon.findOneAndUpdate(
                            { code: couponDetail.code },
                            { $inc: { usedCount: 1 } }
                        );
                    }

                    // Email code ADD किया
                    try {
                        const nodemailer = require('nodemailer');
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS
                            }
                        });
                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: order.customerInfo.email,
                            cc: process.env.EMAIL_RECEIVER,
                            subject: `Order Confirmation - ${order.orderNumber}`,
                            html: `
                                <h2>Lightning Payment Confirmed!</h2>
                                <p>Dear ${order.customerInfo.firstName} ${order.customerInfo.lastName},</p>
                                <p>Thank you for your order!</p>
                                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                                <p><strong>Amount:</strong> $${order.finalTotal.toFixed(2)} USD</p>
                                <p><strong>Payment Method:</strong> Bitcoin Lightning</p>
                                <p><strong>Status:</strong> Confirmed</p>
                                <br/>
                                <p>Thank you for buying at Bitcoin Butik!</p>
                            `
                        });
                        console.log(` Webhook email sent to ${order.customerInfo.email}`);
                    } catch (emailError) {
                        console.error('Webhook email error:', emailError.message);
                    }

                    console.log(`Webhook: Order ${order._id} marked as paid`);
                }
            }
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error('Speed webhook error:', error.message);
        return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
};