// controllers/orderController.js
const Order = require('../models/Order');
const Coupon = require('../models/CouponModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.placeOrder = async (req, res) => {
    try {
        console.log('📥 Received payment request');

        const {
            amount,
            id,
            paymentMethodId,
            browserId,
            items,
            customerInfo,
            note,
            appliedCoupons
        } = req.body;

        const finalPaymentMethodId = paymentMethodId || id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount.' });
        }

        if (!finalPaymentMethodId) {
            return res.status(400).json({ success: false, message: 'Payment method ID required.' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        if (!customerInfo) {
            return res.status(400).json({ success: false, message: 'Customer info required.' });
        }

        let serverCalculatedSubtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        const originalSubtotal = serverCalculatedSubtotal;
        console.log("Order Amount (frontend):", (amount / 100).toFixed(2));
        console.log("Server Original Subtotal:", originalSubtotal.toFixed(2));

        let totalDiscountAmount = 0;
        const appliedValidCoupons = [];

        if (appliedCoupons && appliedCoupons.length > 0) {
            console.log(`Attempting to apply ${appliedCoupons.length} coupons: ${appliedCoupons.join(', ')}`);

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

            const sortedCouponsToApply = [...percentageCoupons, ...fixedCoupons];

            for (const coupon of sortedCouponsToApply) {
                try {

                    const latestCoupon = await Coupon.findById(coupon._id);

                    if (!latestCoupon) {
                        console.warn(`❌ Coupon code not found (after initial fetch) and skipped: ${coupon.code}`);
                        continue;
                    }

                    if (latestCoupon.expiryDate && new Date() > latestCoupon.expiryDate) {
                        console.warn(`❌ Expired coupon skipped: ${latestCoupon.code}`);
                        continue;
                    }

                    if (latestCoupon.usageLimit && latestCoupon.usedCount >= latestCoupon.usageLimit) {
                        console.warn(`❌ Coupon usage limit reached for: ${latestCoupon.code}`);
                        continue;
                    }

                    if (serverCalculatedSubtotal < latestCoupon.minOrderAmount) {
                        console.warn(`❌ Min order amount not met for ${latestCoupon.code}. Required: $${latestCoupon.minOrderAmount.toFixed(2)}, Current: $${serverCalculatedSubtotal.toFixed(2)}`);
                        continue;
                    }

                    let currentCouponDiscount = 0;
                    if (latestCoupon.discountType === 'percentage') {
                        currentCouponDiscount = (serverCalculatedSubtotal * latestCoupon.discountValue) / 100;

                        if (latestCoupon.maxDiscountAmount && currentCouponDiscount > latestCoupon.maxDiscountAmount) {
                            console.log(`  - ${latestCoupon.code}: Capped percentage discount from $${currentCouponDiscount.toFixed(2)} to max $${latestCoupon.maxDiscountAmount.toFixed(2)}`);
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
                        console.log(`✅ Coupon applied: ${latestCoupon.code}, Discount: $${currentCouponDiscount.toFixed(2)}, New Running Total: $${serverCalculatedSubtotal.toFixed(2)}`);
                    } else {
                        console.warn(`  - ${latestCoupon.code}: No discount applied (either 0 or invalid conditions).`);
                    }

                } catch (couponError) {
                    console.error('Error validating or applying coupon:', coupon.code, couponError.message);
                    continue;
                }
            }
        }

        const finalTotal = serverCalculatedSubtotal;
        const finalAmountInCents = Math.round(finalTotal * 100);

        console.log('💵 Final amount after all discounts:', finalTotal.toFixed(2));
        console.log('💳 Amount in cents for Stripe:', finalAmountInCents);

        if (Math.abs(amount - finalAmountInCents) > 10) {
            console.warn(`⚠️ Frontend amount mismatch! Frontend: ${amount}, Backend Calculated: ${finalAmountInCents}. Using backend calculated amount for Stripe.`);
        }


        console.log('✅ Validation passed');
        console.log('💳 Creating PaymentIntent...');

        const paymentIntent = await stripe.paymentIntents.create({
            amount: finalAmountInCents,
            currency: 'usd',
            payment_method: finalPaymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never'
            },
            description: `Order by ${customerInfo.email}`,
            metadata: {
                browserId: browserId || 'unknown',
                customerEmail: customerInfo.email,
                customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
                couponCodes: appliedValidCoupons.map(c => c.code).join(',') || 'none',
                totalDiscountAmount: totalDiscountAmount.toFixed(2)
            },
            receipt_email: customerInfo.email,
            shipping: {
                name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                address: {
                    line1: customerInfo.streetAddress1,
                    line2: customerInfo.streetAddress2 || undefined,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    postal_code: customerInfo.zip,
                    country: customerInfo.country || 'US',
                },
                phone: customerInfo.phone
            },
        });

        console.log('💳 PaymentIntent created:', paymentIntent.id);
        console.log('📊 Payment Status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            const newOrder = new Order({
                customerInfo: customerInfo,
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
                finalTotal: finalTotal,
                note: note || '',
                paymentMethodId: finalPaymentMethodId,
                paymentStatus: 'succeeded',
                stripeChargeId: paymentIntent.id,
                couponUsed: appliedValidCoupons.map(c => c.code).join(', ') || null,
                appliedDiscountsDetails: appliedValidCoupons,
                shippingDetails: {
                    country: customerInfo.country || 'US',
                    state: customerInfo.state,
                    city: customerInfo.city,
                    zip: customerInfo.zip
                },
                createdAt: new Date(),
                orderNumber: `ORD-${Date.now()}`
            });

            await newOrder.save();
            console.log('✅ Order saved:', newOrder._id);

            for (const validCoupon of appliedValidCoupons) {
                await Coupon.findOneAndUpdate(
                    { code: validCoupon.code },
                    { $inc: { usedCount: 1 } }
                );
                console.log(`✅ Coupon usage incremented for: ${validCoupon.code}`);
            }

            return res.status(200).json({
                success: true,
                message: 'Payment successful!',
                paymentId: paymentIntent.id,
                amount: paymentIntent.amount,
                orderId: newOrder._id,
                orderNumber: newOrder.orderNumber,
                customerEmail: customerInfo.email,
                appliedDiscounts: appliedValidCoupons
            });

        } else {
            console.error('❌ Payment not succeeded. Status:', paymentIntent.status);
            return res.status(400).json({
                success: false,
                message: `Payment status: ${paymentIntent.status}`
            });
        }

    } catch (error) {
        console.error('❌ Payment Error:', error.message);
        return res.status(400).json({
            success: false,
            message: error.message || 'Payment failed'
        });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order.' });
    }
};