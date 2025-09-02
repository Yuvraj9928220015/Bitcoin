// controllers/checkoutController.js

const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe

// Function to handle the checkout process and save order to DB
exports.placeOrder = async (req, res) => {
    try {
        const {
            amount, // Amount in cents from client
            id: paymentMethodId, // Stripe PaymentMethod ID
            browserId, // Client-side generated ID for idempotency/tracking
            items, // Array of product items
            customerInfo, // Billing/Customer information
            note, // Optional note
            appliedCoupon // Optional: { code, discount }
        } = req.body;

        if (!amount || !paymentMethodId || !items || !customerInfo) {
            return res.status(400).json({ success: false, message: 'Missing required checkout information.' });
        }

        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty. Cannot place an order.' });
        }

        // Calculate actual subtotal and final total on the server to prevent client manipulation
        const serverCalculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let serverCalculatedFinalTotal = serverCalculatedSubtotal;
        let discountAmount = 0;

        if (appliedCoupon && appliedCoupon.code && appliedCoupon.discount) {
            discountAmount = appliedCoupon.discount;
            serverCalculatedFinalTotal -= discountAmount;
        }

        // Ensure the amount from the client matches server calculation (with a small tolerance)
        // This is crucial for security.
        const tolerance = 1; // Allow for minor floating point discrepancies, e.g., 1 cent
        if (Math.abs(amount - Math.round(serverCalculatedFinalTotal * 100)) > tolerance) {
            console.warn(`Client amount mismatch: Client sent ${amount} cents, Server calculated ${Math.round(serverCalculatedFinalTotal * 100)} cents.`);
            // You might want to return an error here in a production environment
            // return res.status(400).json({ success: false, message: 'Payment amount mismatch. Please try again.' });
        }


        // --- Create a PaymentIntent with Stripe ---
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Use the amount sent from client (already validated against server calc)
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'manual', // Requires explicit confirmation
            confirm: true, // Confirm the PaymentIntent immediately
            description: `Order by ${customerInfo.email}`,
            metadata: {
                browserId: browserId,
                customerEmail: customerInfo.email,
                orderItems: JSON.stringify(items.map(item => ({ id: item.productId, name: item.name, qty: item.quantity })))
            },
            shipping: { // Stripe can also use shipping details
                name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                address: {
                    line1: customerInfo.streetAddress1,
                    line2: customerInfo.streetAddress2 || null,
                    city: customerInfo.city,
                    state: customerInfo.state,
                    postal_code: customerInfo.zip,
                    country: 'US', // Assuming US for now based on your form
                },
                phone: customerInfo.phone
            },
            // Optionally, save customer details to Stripe Customer object if you plan recurring payments
            // customer: 'cus_xyz' 
        });

        // Handle PaymentIntent status
        if (paymentIntent.status === 'succeeded') {
            // Payment was successful, save order details to database
            const newOrder = new Order({
                customerInfo: customerInfo,
                items: items.map(item => ({
                    productId: item.id || item.cartId, // Use item.id or item.cartId as product identifier
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size || undefined
                })),
                subtotal: serverCalculatedSubtotal,
                discountAmount: discountAmount,
                finalTotal: serverCalculatedFinalTotal,
                note: note,
                paymentMethodId: paymentMethodId,
                paymentStatus: 'succeeded',
                stripeChargeId: paymentIntent.id, // Store PaymentIntent ID
                shippingDetails: { // For this example, shipping is same as billing
                    country: customerInfo.country,
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
            // Handle 3D Secure or other required actions
            console.log('Payment requires action:', paymentIntent.next_action);
            return res.status(400).json({
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
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during checkout.'
        });
    }
};

// Optional: Get all orders (for admin panel, etc.)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
};

// Optional: Get a single order by ID
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