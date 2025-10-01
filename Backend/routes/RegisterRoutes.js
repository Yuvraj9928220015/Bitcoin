const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/RegisterController');
const { protect } = require('../middleware/authMiddleware'); // Assuming you have this middleware

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); 

module.exports = router;