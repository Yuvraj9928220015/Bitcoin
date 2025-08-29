const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
    title: {
        type: String,
        enum: ['Mr', 'Ms', 'Mx', ''],
        default: ''
    },
    firstName: {
        type: String,
        required: [true, 'Please enter your first name']
    },
    lastName: {
        type: String,
        required: [true, 'Please enter your last name']
    },
    country: {
        type: String,
        required: [true, 'Please select your country'],
        default: 'United States'
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false 
    },
    termsAgreed: {
        type: Boolean,
        required: [true, 'You must agree to the privacy information'],
        default: false
    },
    newsletterAgreed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Register', RegisterSchema);