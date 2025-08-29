const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
    if (req.cookies && req.cookies.sessionToken) {
        try {
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized: No session token' });
    }
};

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {

        res.cookie('sessionToken', 'admin_session_valid', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 3600000
        });

        return res.status(200).json({ success: true, message: 'Logged in successfully' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('sessionToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/verify', isAuthenticated, (req, res) => {
    res.status(200).json({ authenticated: true, message: 'User is authenticated' });
});

module.exports = router;