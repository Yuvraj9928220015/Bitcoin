// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const { createContactMessage, getAllContactMessages } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', createContactMessage);

router.get('/', protect, getAllContactMessages);


module.exports = router;