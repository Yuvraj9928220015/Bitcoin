const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sessionId: {
        type: String,
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
        index: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    price: {
        type: Number,
        required: [true, 'Please add a silver price'],
        min: [0, 'Price cannot be negative']
    },
    goldPrice: {
        type: Number,
        required: [true, 'Please add a gold price'],
        min: [0, 'Gold price cannot be negative']
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    image: {
        type: [String],
        required: [true, 'Please add at least one image'],
        validate: [val => val.length > 0, 'Please add at least one image']
    },
    video: {
        type: String,
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ goldPrice: 1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model('Product', productSchema);