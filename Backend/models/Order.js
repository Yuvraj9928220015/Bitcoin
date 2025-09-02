// models/Order.js

const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String }
});

const orderSchema = new mongoose.Schema({
    customerInfo: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        country: { type: String, required: true },
        streetAddress1: { type: String, required: true },
        streetAddress2: { type: String }, // Optional
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true }
    },
    
    items: [productItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalTotal: { type: Number, required: true },
    note: { type: String },
    
    paymentMethodId: { type: String, required: true },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'succeeded', 'failed', 'refunded'], 
        default: 'pending' 
    },
    stripeChargeId: { type: String }, // Stripe Charge ID after successful payment

    // Shipping Details (can be same as billing or separate if you add a 'ship to different address' option)
    shippingDetails: {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        zip: { type: String }
        // Add more shipping address fields if it can differ from billing
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);