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
    image: {
        type: [String],
        required: [true, 'Please add at least one image'],
        validate: [val => val.length > 0, 'Please add at least one image']
    },
    video: {
        type: String,
    },
   stock: {
        type: Number,
        required: true, 
        min: [0, 'Stock cannot be negative'], // Added min validator here
        default: 0, // <--- ADDED THIS DEFAULT VALUE
    },
}, {
    timestamps: true
});

// Add indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ goldPrice: 1 });
productSchema.index({ stock: 1 });

// Add a pre-save hook to ensure stock is always a number and defaults if not provided
productSchema.pre('save', function(next) {
    if (this.isModified('stock') || this.isNew) { // Only run if stock is modified or it's a new document
        if (this.stock === undefined || this.stock === null || this.stock === '') {
            this.stock = 0;
        } else {
            this.stock = Number(this.stock); // Ensure it's a number
            if (isNaN(this.stock)) {
                this.stock = 0; // Default to 0 if parsing results in NaN
            }
        }
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);