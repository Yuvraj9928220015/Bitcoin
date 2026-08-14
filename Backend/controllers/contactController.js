const Contact = require('../models/contact');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const createContactMessage = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, country, subject, message } = req.body;

        if (!firstName || !lastName || !email || !phone || !country || !subject || !message) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        const newContact = new Contact({ firstName, lastName, email, phone, country, subject, message });
        const savedContact = await newContact.save();

        const NOTIFY_EMAIL = "dailyreport015@gmail.com";

        await transporter.sendMail({
            from: `"BitcoinButik Website" <${process.env.EMAIL_USER}>`,
            to: NOTIFY_EMAIL,
            replyTo: email,
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Country:</strong> ${country}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        });

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

const getAllContactMessages = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json(contacts);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Failed to fetch messages.'
        });
    }
};

module.exports = {
    createContactMessage,
    getAllContactMessages
};