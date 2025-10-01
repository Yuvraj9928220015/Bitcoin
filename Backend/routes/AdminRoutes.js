const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/AdminController');
const { protect } = require('../middleware/adminMiddleware'); 

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); 

module.exports = router;