// models/Order.js

const mongoose = require('mongoose');

const productItemSchema = new mongoose.Schema({
    productId:
    {
        type: String,
        required: true
    },
    name:
    {
        type: String,
        required: true
    },
    image:
    {
        type: String,
        required: true
    },
    price:
    {
        type: Number,
        required: true
    },
    quantity:
    {
        type: Number,
        required: true,
        min: 1
    },
    size:
    {
        type: String
    }
});

const orderSchema = new mongoose.Schema({
    customerInfo: {
        firstName:
        {
            type: String,
            required: true
        },
        lastName:
        {
            type: String,
            required: true
        },
        email:
        {
            type: String,
            required: true
        },
        phone:
        {
            type: String,
            required: true
        },
        country:
        {
            type: String,
            required: true
        },
        streetAddress1:
        {
            type: String,
            required: true
        },
        streetAddress2:
        {
            type: String
        },
        city:
        {
            type: String,
            required: true
        },
        state:
        {
            type: String,
        },
        zip:
        {
            type: String,
            required: true
        }
    },

    items: [productItemSchema],
    subtotal:
    {
        type: Number,
        required: true
    },
    discountAmount:
    {
        type: Number,
        default: 0
    },
    finalTotal:
    {
        type: Number,
        required: true
    },
    note:
    {
        type: String
    },

    // CHANGE 1: required: true → hata diya (Lightning payment mein card ID nahi hoti)
    paymentMethodId: { type: String },

    // CHANGE 2: paymentMethod field ADD kiya (card ya lightning)
    paymentMethod: {
        type: String,
        enum: ['card', 'bitcoin_lightning'],
        default: 'card'
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    stripeChargeId: { type: String },

    // CHANGE 3: speedPaymentId field ADD kiya (Speed Lightning payment ID)
    speedPaymentId: { type: String, default: null, index: true },

    // Coupon fields (pehle se hai toh theek, nahi hai toh add karo)
    couponUsed: { type: String, default: null },
    appliedDiscountsDetails: [{
        code: String,
        discountType: String,
        discountValue: Number,
        discountAmount: Number,
    }],

    orderNumber: { type: String },

    shippingDetails: {
        country: { type: String },
        state: { type: String },
        city: { type: String },
        zip: { type: String }
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);