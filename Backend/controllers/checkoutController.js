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
            appliedCoupon
        } = req.body;

        const finalPaymentMethodId = paymentMethodId || id;

        // Validation
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

        // Calculate server-side subtotal
        const serverCalculatedSubtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        console.log("Order Amount (frontend):", orderAmount);
        console.log("Server Subtotal:", serverCalculatedSubtotal);

        // Validate and apply coupon on backend
        let discountAmount = 0;
        let validatedCoupon = null;

        if (appliedCoupon && appliedCoupon.code) {
            try {
                const coupon = await Coupon.findOne({
                    code: appliedCoupon.code.toUpperCase(),
                    isActive: true
                });

                if (coupon) {
                    // Check if expired
                    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
                        return res.status(400).json({
                            success: false,
                            message: 'Coupon has expired'
                        });
                    }

                    // Check usage limit
                    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                        return res.status(400).json({
                            success: false,
                            message: 'Coupon usage limit reached'
                        });
                    }

                    // Check minimum order amount
                    if (serverCalculatedSubtotal < coupon.minOrderAmount) {
                        return res.status(400).json({
                            success: false,
                            message: `Minimum order amount of $${coupon.minOrderAmount} required`
                        });
                    }

                    // Calculate discount
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (serverCalculatedSubtotal * coupon.discountValue) / 100;

                        // Apply max discount cap if exists
                        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                            discountAmount = coupon.maxDiscountAmount;
                        }
                    } else if (coupon.discountType === 'fixed') {
                        discountAmount = Math.min(coupon.discountValue, serverCalculatedSubtotal);
                    }

                    validatedCoupon = {
                        code: coupon.code,
                        discountType: coupon.discountType,
                        discountValue: coupon.discountValue,
                        discountAmount: discountAmount
                    };

                    console.log('✅ Coupon validated:', validatedCoupon);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid coupon code'
                    });
                }
            } catch (couponError) {
                console.error('Error validating coupon:', couponError);
                return res.status(400).json({
                    success: false,
                    message: 'Error validating coupon'
                });
            }
        }

        // Calculate final total
        const finalTotal = serverCalculatedSubtotal - discountAmount;
        const finalAmountInCents = Math.round(finalTotal * 100);

        console.log('💵 Final amount after discount:', finalTotal);
        console.log('💳 Amount in cents:', finalAmountInCents);

        // Verify amount matches what frontend sent
        if (Math.abs(amount - finalAmountInCents) > 1) {
            console.warn('⚠️ Amount mismatch! Frontend:', amount, 'Backend:', finalAmountInCents);
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
                couponCode: validatedCoupon ? validatedCoupon.code : 'none',
                discountAmount: discountAmount.toFixed(2)
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
            // Save order
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
                subtotal: serverCalculatedSubtotal,
                discountAmount: discountAmount,
                finalTotal: finalTotal,
                note: note || '',
                paymentMethodId: finalPaymentMethodId,
                paymentStatus: 'succeeded',
                stripeChargeId: paymentIntent.id,
                couponUsed: validatedCoupon ? validatedCoupon.code : null,
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

            // Increment coupon usage count
            if (validatedCoupon) {
                await Coupon.findOneAndUpdate(
                    { code: validatedCoupon.code },
                    { $inc: { usedCount: 1 } }
                );
                console.log('✅ Coupon usage incremented');
            }

            return res.status(200).json({
                success: true,
                message: 'Payment successful!',
                paymentId: paymentIntent.id,
                amount: paymentIntent.amount,
                orderId: newOrder._id,
                orderNumber: newOrder.orderNumber,
                customerEmail: customerInfo.email,
                appliedDiscount: discountAmount > 0 ? {
                    code: validatedCoupon.code,
                    amount: discountAmount
                } : null
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