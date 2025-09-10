const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Validation middleware
const validateQuestionData = (req, res, next) => {
    const { name, email, question, productName } = req.body;

    // Check required fields
    if (!name || !email || !question || !productName) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, email, question, and productName are required'
        });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
        });
    }

    // Validate field lengths
    if (name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Name must be at least 2 characters long'
        });
    }

    if (question.trim().length < 10) {
        return res.status(400).json({
            success: false,
            message: 'Question must be at least 10 characters long'
        });
    }

    next();
};

// Routes

// POST /api/questions - Create new question
router.post('/', validateQuestionData, questionController.createQuestion);

// GET /api/questions - Get all questions (with pagination and filters)
router.get('/', questionController.getAllQuestions);

// GET /api/questions/:id - Get question by ID
router.get('/:id', questionController.getQuestionById);

// PUT /api/questions/:id/status - Update question status
router.put('/:id/status', questionController.updateQuestionStatus);

// DELETE /api/questions/:id - Delete question
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;