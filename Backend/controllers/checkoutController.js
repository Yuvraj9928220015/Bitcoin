const Order = require('../models/Order');
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

        console.log('✅ Validation passed');
        console.log('💳 Creating PaymentIntent...');

        // ✅ FIXED CODE - Sirf yeh change karo
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
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
            // Calculate totals
            const serverCalculatedSubtotal = items.reduce((sum, item) => {
                return sum + (parseFloat(item.price) * parseInt(item.quantity));
            }, 0);

            let discountAmount = 0;
            let finalTotal = serverCalculatedSubtotal;

            if (appliedCoupon && appliedCoupon.discount) {
                discountAmount = parseFloat(appliedCoupon.discount);
                finalTotal -= discountAmount;
            }

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

            return res.status(200).json({
                success: true,
                message: 'Payment successful!',
                paymentId: paymentIntent.id,
                amount: paymentIntent.amount,
                orderId: newOrder._id,
                orderNumber: newOrder.orderNumber
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
