const Register = require('../models/Register');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res, next) => {
    const { title, firstName, lastName, country, email, password, termsAgreed, newsletterAgreed } = req.body;

    if (!firstName || !lastName || !email || !password || !termsAgreed) {
        return res.status(400).json({ message: 'Please enter all required fields and agree to terms.' });
    }

    try {
        let user = await Register.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await Register.create({
            title,
            firstName,
            lastName,
            country,
            email,
            password: hashedPassword,
            termsAgreed,
            newsletterAgreed
        });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email
            },
            message: 'User registered successfully!'
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: 'Server error during registration.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
        });
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter both email and password.' });
    }

    try {
        const user = await Register.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials. User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials. Password mismatch.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE
        });

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                email: user.email
            },
            message: 'Logged in successfully!'
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: 'Server error during login.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
        });
    }
};

exports.getMe = async (req, res, next) => {
    // req.user.id is set by the 'protect' middleware
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized, no user data from token.' });
    }

    try {
        const user = await Register.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                country: user.country
            }
        });
    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({
            message: 'Server error fetching user data.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
        });
    }
};