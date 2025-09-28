const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.placeOrder = async (req, res) => {
    try {
        // Add detailed logging of the request body
        console.log('📥 Received payment request:', JSON.stringify(req.body, null, 2));
        
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

        // Fix: Use paymentMethodId if id is not provided (frontend sends paymentMethodId)
        const finalPaymentMethodId = paymentMethodId || id;

        // Log each field individually for debugging
        console.log('🔍 Field validation:', {
            amount: amount,
            amountType: typeof amount,
            id: id,
            paymentMethodId: paymentMethodId,
            finalPaymentMethodId: finalPaymentMethodId,
            itemsCount: items ? items.length : 'undefined',
            customerInfoExists: !!customerInfo
        });

        // Enhanced validation with better error messages
        if (!amount && amount !== 0) {
            console.error('❌ Amount validation failed:', amount);
            return res.status(400).json({ success: false, message: 'Amount is required.' });
        }

        if (!finalPaymentMethodId) {
            console.error('❌ PaymentMethodId validation failed. Received:', {
                id: id,
                paymentMethodId: paymentMethodId,
                finalPaymentMethodId: finalPaymentMethodId
            });
            return res.status(400).json({ success: false, message: 'Payment method ID is required.' });
        }

        if (!items) {
            console.error('❌ Items validation failed:', items);
            return res.status(400).json({ success: false, message: 'Items are required.' });
        }

        if (!customerInfo) {
            console.error('❌ CustomerInfo validation failed:', customerInfo);
            return res.status(400).json({ success: false, message: 'Customer information is required.' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            console.error('❌ Items array validation failed:', items);
            return res.status(400).json({ success: false, message: 'Cart is empty. Cannot place an order.' });
        }

        // Validate amount is a positive number
        if (typeof amount !== 'number' || amount <= 0) {
            console.error('❌ Amount number validation failed:', amount, typeof amount);
            return res.status(400).json({ success: false, message: 'Invalid amount provided.' });
        }

        console.log('✅ All validations passed, proceeding with payment...');

        // Calculate server-side totals for verification
        const serverCalculatedSubtotal = items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            return sum + (itemPrice * itemQuantity);
        }, 0);

        let serverCalculatedFinalTotal = serverCalculatedSubtotal;
        let discountAmount = 0;

        if (appliedCoupon && appliedCoupon.code && appliedCoupon.discount) {
            discountAmount = parseFloat(appliedCoupon.discount) || 0;
            serverCalculatedFinalTotal -= discountAmount;
        }

        // Verify the amount sent from client matches server calculation (allow small tolerance for rounding)
        const tolerance = 5; // 5 cents tolerance
        const expectedAmountInCents = Math.round(serverCalculatedFinalTotal * 100);
        
        console.log('💰 Amount verification:', {
            clientAmount: amount,
            serverCalculated: expectedAmountInCents,
            difference: Math.abs(amount - expectedAmountInCents)
        });
        
        if (Math.abs(amount - expectedAmountInCents) > tolerance) {
            console.warn(`Client amount mismatch: Client sent ${amount} cents, Server calculated ${expectedAmountInCents} cents.`);
            return res.status(400).json({ 
                success: false, 
                message: `Amount mismatch. Expected ${expectedAmountInCents} cents, received ${amount} cents.` 
            });
        }

        console.log(`🔄 Creating PaymentIntent with Payment Method: ${finalPaymentMethodId}`);

        // Create the Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            payment_method: finalPaymentMethodId,
            confirmation_method: 'manual',
            confirm: true,
            description: `Order by ${customerInfo.email}`,
            metadata: {
                browserId: browserId || 'unknown',
                customerEmail: customerInfo.email,
                orderItems: JSON.stringify(items.map(item => ({ 
                    id: item.productId || item.id, 
                    name: item.name, 
                    qty: item.quantity 
                })))
            },
            shipping: {
                name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                address: {
                    line1: customerInfo.streetAddress1,
                    line2: customerInfo.streetAddress2 || null,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    postal_code: customerInfo.zip,
                    country: customerInfo.country || 'US',
                },
                phone: customerInfo.phone
            },
        });

        console.log('💳 PaymentIntent created:', {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount
        });

        if (paymentIntent.status === 'succeeded') {
            // Create and save the order to database
            const newOrder = new Order({
                customerInfo: customerInfo,
                items: items.map(item => ({
                    productId: item.productId || item.id || item.cartId,
                    name: item.name,
                    image: item.image,
                    price: parseFloat(item.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    size: item.size || undefined
                })),
                subtotal: serverCalculatedSubtotal,
                discountAmount: discountAmount,
                finalTotal: serverCalculatedFinalTotal,
                note: note || '',
                paymentMethodId: finalPaymentMethodId,
                paymentStatus: 'succeeded',
                stripeChargeId: paymentIntent.id,
                shippingDetails: {
                    country: customerInfo.country || 'US',
                    state: customerInfo.state,
                    city: customerInfo.city,
                    zip: customerInfo.zip
                }
            });

            await newOrder.save();
            console.log('✅ Order saved to database:', newOrder._id);

            return res.status(200).json({
                success: true,
                message: 'Payment successful and order placed!',
                paymentId: paymentIntent.id,
                amount: paymentIntent.amount,
                customerEmail: customerInfo.email,
                orderId: newOrder._id
            });

        } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_source_action') {
            console.log('⚠️ Payment requires action:', paymentIntent.next_action);
            return res.status(200).json({
                success: false,
                message: 'Payment requires additional action. Please complete the authentication.',
                requiresAction: true,
                clientSecret: paymentIntent.client_secret
            });
        } else {
            console.error('❌ Stripe PaymentIntent status:', paymentIntent.status);
            return res.status(400).json({
                success: false,
                message: `Payment failed with status: ${paymentIntent.status}. Please try again.`
            });
        }

    } catch (error) {
        console.error('❌ Error during placeOrder:', error);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                success: false,
                message: error.message || 'Your card was declined. Please try a different payment method.'
            });
        }
        
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment information. Please check your details and try again.'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during checkout.'
        });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
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
        console.error('❌ Error fetching order by ID:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order.' });
    }
};