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
    // Silver price - now optional, depends on hasSilver flag
    price: {
        type: Number,
        default: null,
        min: [0, 'Price cannot be negative']
    },
    // Gold price - now optional, depends on hasGold flag
    goldPrice: {
        type: Number,
        default: null,
        min: [0, 'Gold price cannot be negative']
    },
    // NEW: Gram weight for the product
    grams: {
        type: Number,
        required: [true, 'Please add gram weight'],
        min: [0.01, 'Grams must be at least 0.01'],
        default: 1
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    // Flags to determine product types
    hasSilver: {
        type: Boolean,
        default: true
    },
    hasGold: {
        type: Boolean,
        default: true
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

// Pre-save validation hook
productSchema.pre('save', function(next) {
    // At least one product type must be selected
    if (!this.hasSilver && !this.hasGold) {
        return next(new Error('Product must have at least one type (Silver or Gold)'));
    }
    
    // If hasSilver is true, price must be provided
    if (this.hasSilver && (this.price === null || this.price === undefined)) {
        return next(new Error('Silver price is required when Silver product is selected'));
    }
    
    // If hasGold is true, goldPrice must be provided
    if (this.hasGold && (this.goldPrice === null || this.goldPrice === undefined)) {
        return next(new Error('Gold price is required when Gold product is selected'));
    }
    
    // If hasSilver is false, ensure price is null
    if (!this.hasSilver) {
        this.price = null;
    }
    
    // If hasGold is false, ensure goldPrice is null
    if (!this.hasGold) {
        this.goldPrice = null;
    }
    
    next();
});

// Pre-update validation hook
productSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    const updateFields = update.$set || update;
    
    // Check if hasSilver or hasGold flags are being updated
    const hasSilver = updateFields.hasSilver !== undefined ? updateFields.hasSilver : true;
    const hasGold = updateFields.hasGold !== undefined ? updateFields.hasGold : true;
    
    // At least one product type must be selected
    if (!hasSilver && !hasGold) {
        return next(new Error('Product must have at least one type (Silver or Gold)'));
    }
    
    next();
});

// Add indexes for better query performance
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ goldPrice: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ hasSilver: 1 });
productSchema.index({ hasGold: 1 });
productSchema.index({ grams: 1 }); // NEW: Index for grams

module.exports = mongoose.model('Product', productSchema);