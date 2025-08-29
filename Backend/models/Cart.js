// models/Cart.js

const mongoose = require('mongoose');

// Schema for individual items within the cart
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        ref: 'Product'
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true,
        default: '/placeholder.jpg'
    },
    size: {
        type: String,
        default: 'One Size'
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    cartItemId: {
        type: String,
        required: true,
        unique: true
    }
}, { _id: false });


const cartSchema = new mongoose.Schema({
    browserId: {
        type: String,
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;