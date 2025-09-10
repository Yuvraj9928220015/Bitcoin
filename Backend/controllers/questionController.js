const Question = require('../models/Question');
const nodemailer = require('nodemailer');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const questionController = {
    createQuestion: async (req, res) => {
        try {
            const { name, email, question, productName, productId } = req.body;

            if (!name || !email || !question || !productName) {
                return res.status(400).json({
                    success: false,
                    message: 'Please fill in all required fields'
                });
            }

            // Create new question
            const newQuestion = new Question({
                name,
                email,
                question,
                productName,
                productId
            });

            // Save to database
            const savedQuestion = await newQuestion.save();

            const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #fff; }
            .question-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
            .footer { background-color: #333; color: #fff; padding: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Product Question Received</h2>
            </div>
            <div class="content">
              <h3>Customer Information:</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Product:</strong> ${productName}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              
              <div class="question-box">
                <h3>Question:</h3>
                <p>${question}</p>
              </div>
              
              <p><em>Please respond to the customer at: ${email}</em></p>
            </div>
            <div class="footer">
              <p>Bitcoin Butik - Product Question System</p>
              <p>Question ID: ${savedQuestion._id}</p>
            </div>
          </div>
        </body>
        </html>
      `;

            // Email options for admin
            const adminMailOptions = {
                from: process.env.ADMIN_EMAIL,
                to: process.env.EMAIL_RECEIVER,
                subject: `New Product Question: ${productName}`,
                html: emailHTML
            };

            // Email options for customer (confirmation)
            const customerMailOptions = {
                from: process.env.EMAIL_USER, // <-- Yeh pehle se sahi hai
                to: email,
                subject: `Your Question About ${productName} - Bitcoin Butik`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #fff; }
              .footer { background-color: #f4f4f4; padding: 15px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Thank You for Your Question!</h2>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for your question about <strong>${productName}</strong>.</p>
                <p>We have received your inquiry and our team will get back to you within 24-48 hours.</p>
                <p><strong>Your Question:</strong></p>
                <blockquote style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff;">
                  ${question}
                </blockquote>
                <p>If you have any urgent concerns, please feel free to contact us directly at info@bitcoinbutik.com</p>
                <p>Best regards,<br>Bitcoin Butik Team</p>
              </div>
              <div class="footer">
                <p>Bitcoin Butik - Your Trusted Jewelry Partner</p>
                <p>Question ID: ${savedQuestion._id}</p>
              </div>
            </div>
          </body>
          </html>
        `
            };

            // Send emails
            try {
                // Send to admin
                await transporter.sendMail(adminMailOptions);
                console.log('Admin notification email sent successfully');

                await transporter.sendMail(customerMailOptions);
                console.log('Customer confirmation email sent successfully');
            } catch (emailError) {
                console.error('Email sending error:', emailError);
            }

            res.status(201).json({
                success: true,
                message: 'Question submitted successfully! We will get back to you soon.',
                data: {
                    id: savedQuestion._id,
                    name: savedQuestion.name,
                    email: savedQuestion.email,
                    productName: savedQuestion.productName,
                    createdAt: savedQuestion.createdAt
                }
            });

        } catch (error) {
            console.error('Error creating question:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit question. Please try again.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // Get all questions (for admin)
    getAllQuestions: async (req, res) => {
        try {
            const { page = 1, limit = 10, status, productName } = req.query;

            const query = {};
            if (status) query.status = status;
            if (productName) query.productName = new RegExp(productName, 'i');

            const questions = await Question.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const total = await Question.countDocuments(query);

            res.status(200).json({
                success: true,
                data: questions,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching questions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch questions'
            });
        }
    },

    // Get question by ID
    getQuestionById: async (req, res) => {
        try {
            const question = await Question.findById(req.params.id);

            if (!question) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            res.status(200).json({
                success: true,
                data: question
            });
        } catch (error) {
            console.error('Error fetching question:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch question'
            });
        }
    },

    // Update question status
    updateQuestionStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const questionId = req.params.id;

            if (!['pending', 'answered', 'closed'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const updatedQuestion = await Question.findByIdAndUpdate(
                questionId,
                { status, updatedAt: new Date() },
                { new: true }
            );

            if (!updatedQuestion) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Question status updated successfully',
                data: updatedQuestion
            });
        } catch (error) {
            console.error('Error updating question:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update question'
            });
        }
    },

    // Delete question
    deleteQuestion: async (req, res) => {
        try {
            const deletedQuestion = await Question.findByIdAndDelete(req.params.id);

            if (!deletedQuestion) {
                return res.status(404).json({
                    success: false,
                    message: 'Question not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Question deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting question:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete question'
            });
        }
    }
};

module.exports = questionController;