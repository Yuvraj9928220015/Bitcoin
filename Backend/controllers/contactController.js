const Contact = require('../models/contact');

const createContactMessage = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            country,
            subject,
            message
        } = req.body;

        if (!firstName || !lastName || !email || !phone || !country || !subject || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        const newContact = new Contact({
            firstName,
            lastName,
            email,
            phone,
            country,
            subject,
            message
        });

        const savedContact = await newContact.save();


        res.status(201).json({
            success: true,
            message: 'Your message has been sent successfully!',
            data: savedContact
        });

    } catch (error) {
        console.error('Error saving contact message:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({
            success: false,
            message: 'Server error. Failed to send message.'
        });
    }
};

module.exports = {
    createContactMessage
};