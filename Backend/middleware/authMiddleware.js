const jwt = require('jsonwebtoken');
const Register = require('../models/Register'); 

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await Register.findById(decoded.id).select('-password'); 

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found for this token.' });
            }

            next();
        } catch (error) {
            console.error("Authentication Error:", error);
            return res.status(401).json({ message: 'Not authorized, token is invalid or expired.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided.' });
    }
};

module.exports = { protect };