const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const Stripe = require("stripe");
const path = require('path');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config();

const app = express();

// const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/Bitcoine";
const MONGO_URL = "mongodb://bituser:Bitcoinbutik%402111@93.127.172.98:27017/Bitcoine?authSource=Bitcoine";
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_for_jwt_change_in_production';
const PORT = process.env.PORT || 9000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://bitcoinbutik.com",
        "https://bitcoinbutik.com",
        "https://www.bitcoinbutik.com"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Browser-ID',
        'X-Requested-With'
    ],
    exposedHeaders: ['X-Browser-ID']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("Mongoose Connected to MongoDB");
        console.log(`Connected to database: ${mongoose.connection.name}`);
    })
    .catch(error => console.error("Database Connection Error:", error));

const Register = require('./models/Register');
const userSchema = new mongoose.Schema({
    title: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },
    termsAgreed: { type: Boolean, required: true, default: false },
    newsletterAgreed: { type: Boolean, default: false },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        Receiver: process.env.EMAIL_RECEIVER
    },
});
console.log("Nodemailer transporter configured:", !!transporter);

app.use(session({
    secret: process.env.SESSION_SECRET || 'bitcoine_browser_cart_secret_change_in_production',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        collectionName: 'browser_sessions',
        touchAfter: 24 * 3600,
        ttl: 30 * 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    },
    name: 'bitcoine.browser.session'
}));

app.use((req, res, next) => {
    req.browserInfo = {
        userAgent: req.headers['user-agent'] || '',
        acceptLanguage: req.headers['accept-language'] || '',
        acceptEncoding: req.headers['accept-encoding'] || '',
        ip: req.ip || req.connection.remoteAddress || '',
        platform: req.headers['sec-ch-ua-platform'] || '',
        browserId: req.headers['x-browser-id'] || null
    };

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        console.log('Session ID:', req.sessionID);
        console.log('Browser ID:', req.browserInfo.browserId);
        console.log('User Agent:', req.browserInfo.userAgent.substring(0, Math.min(req.browserInfo.userAgent.length, 50)) + '...');

        if (req.path.includes('/cart')) {
            console.log('Cart route accessed');
        }
    }
    next();
});

const verifyAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.id;
        next();
    } catch (err) {
        res.clearCookie('token');
        res.status(401).json({ message: 'Token is not valid.' });
    }
};

const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const contactRouter = require('./routes/contactRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const registerAuthRoutes = require('./routes/RegisterRoutes');
const questionRoutes = require('./routes/questionRoutes');

app.get('/', (req, res) => res.send('Bitcoine API is running - LIVE Stripe Integration Active!'));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        session: req.session ? 'Active' : 'Inactive',
        sessionId: req.sessionID,
        browserSupported: !!req.headers['user-agent'],
        cartSystem: 'Browser-Specific (No Login Required)',
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY,
        stripeMode: process.env.STRIPE_SECRET_KEY?.includes('_live_') ? 'LIVE' : 'TEST',
        timestamp: new Date().toISOString()
    });
});

// Browser Info route
app.get('/api/browser-info', (req, res) => {
    res.json({
        browserId: req.headers['x-browser-id'] || 'not-provided',
        sessionId: req.sessionID,
        isNewSession: req.session.isNew,
        userAgent: req.browserInfo.userAgent.substring(0, Math.min(req.browserInfo.userAgent.length, 100)),
        platform: req.browserInfo.platform,
        timestamp: new Date().toISOString()
    });
});

// Stripe Configuration for Frontend
app.get('/api/config/stripe', (req, res) => {
    console.log("Frontend requesting Stripe config...");
    console.log("Returning publishable key:", process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// New Admin Login Route
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    // if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    if (email == "bitcoinbutik123@gmail.com" && password == "Bitcoinbutik") {
        req.session.isAuthenticated = true;
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.use('/api/auth', registerAuthRoutes);

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });

        res.json({ success: true, message: 'Login successful' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { title, firstName, lastName, country, email, password, termsAgreed, newsletterAgreed } = req.body;

    if (!firstName || !lastName || !email || !password || !termsAgreed) {
        return res.status(400).json({ message: 'Please enter all required fields and agree to terms.' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            title,
            firstName,
            lastName,
            country,
            email,
            password: hashedPassword,
            termsAgreed,
            newsletterAgreed
        });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: '1h'
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
});

// Logout Route
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Verify Auth status
app.get('/api/auth/verify', (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ authenticated: false });
    }
    try {
        jwt.verify(token, JWT_SECRET);
        res.json({ authenticated: true });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await Register.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({
            message: 'Server error fetching user data.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong.'
        });
    }
});

// API Endpoint for Contact Information
app.get('/api/contact-info', (req, res) => {
    try {
        const contactDetails = {
            companyName: "Bitcoine Jewelry",
            email: "support@bitcoine.com",
            phone: "+1 (800) 555-0199",
            address: "123 Gemstone Alley, Jewel City, JC 10001, USA",
            hours: {
                mondayToFriday: "9:00 AM - 6:00 PM EST",
                saturday: "10:00 AM - 4:00 PM EST",
                sunday: "Closed"
            },
        };
        res.status(200).json(contactDetails);
    } catch (error) {
        console.error("Error fetching contact info:", error);
        res.status(500).json({ message: "Failed to retrieve contact information." });
    }
});



// **************************************************************




// --- FIXED Stripe Payment Processing ---
app.post("/api/payment", async (req, res) => {
    let { amount, id, paymentMethodId, browserId, customerInfo, items, note } = req.body;

    console.log("=== LIVE PAYMENT REQUEST ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));

    const finalPaymentMethodId = paymentMethodId || id;

    console.log("Amount:", amount);
    console.log("Payment Method ID (id):", id);
    console.log("Payment Method ID (paymentMethodId):", paymentMethodId);
    console.log("Final Payment Method ID:", finalPaymentMethodId);
    console.log("Customer:", customerInfo?.firstName, customerInfo?.lastName);
    console.log("Items count:", items?.length);

    // Updated validation to check for either field
    if (!amount || (!id && !paymentMethodId)) {
        console.error("Validation failed:", {
            amount: amount,
            id: id,
            paymentMethodId: paymentMethodId
        });
        return res.status(400).json({
            message: "Amount and payment method ID are required.",
            success: false,
            debug: {
                amountReceived: amount,
                idReceived: id,
                paymentMethodIdReceived: paymentMethodId
            }
        });
    }

    if (amount < 50) {
        return res.status(400).json({
            message: "Amount must be at least $0.50",
            success: false
        });
    }

    try {
        console.log(`Processing LIVE payment for amount: $${amount / 100} USD`);
        console.log(`Customer: ${customerInfo?.firstName} ${customerInfo?.lastName}`);
        console.log(`Email: ${customerInfo?.email}`);
        console.log(`Using Payment Method ID: ${finalPaymentMethodId}`);

        const payment = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            description: `Bitcoine Jewelry Purchase - Order for ${customerInfo?.email || 'customer'}`,
            payment_method: finalPaymentMethodId,
            confirm: true,
            metadata: {
                browserId: browserId || 'unknown',
                sessionId: req.sessionID,
                customerName: `${customerInfo?.firstName} ${customerInfo?.lastName}`,
                customerEmail: customerInfo?.email || '',
                orderNote: note || 'No note',
                itemCount: items?.length?.toString() || '0',
                timestamp: new Date().toISOString(),
                source: 'bitcoine_website_live'
            },
            receipt_email: customerInfo?.email || null
        });

        console.log("LIVE PAYMENT SUCCESSFUL!");
        console.log("Payment Intent ID:", payment.id);
        console.log("Amount charged: $", amount / 100);
        console.log("Payment Status:", payment.status);
        console.log("This payment will appear in your Stripe Live Dashboard");

        // Send confirmation email
        if (transporter && customerInfo?.email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: customerInfo.email,
                    cc: process.env.EMAIL_RECEIVER,
                    subject: `Order Confirmation - Payment Successful #${payment.id.substring(payment.id.length - 8)}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #4CAF50;">Thank you for your order!</h2>
                            <p>Dear ${customerInfo.firstName} ${customerInfo.lastName},</p>
                            <p>Your payment of <strong style="color: #2E7D32;">$${(amount / 100).toFixed(2)} USD</strong> has been processed successfully!</p>

                            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Payment ID:</strong> ${payment.id}</p>
                                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Payment Status:</strong> <span style="color: #4CAF50;">Confirmed</span></p>
                                ${note ? `<p><strong>Order Note:</strong> ${note}</p>` : ''}
                            </div>

                            <p>We will process your order shortly and send you tracking information once shipped.</p>
                            <p>Thank you for shopping with Bitcoine Jewelry!</p>

                            <hr style="margin: 20px 0;">
                            <p style="font-size: 12px; color: #666;">
                                This is a live transaction confirmation. Your card has been charged.
                            </p>
                        </div>
                    `
                });
                console.log("Confirmation email sent to:", customerInfo.email);
            } catch (emailError) {
                console.error("Email sending failed:", emailError.message);
            }
        }

        res.json({
            message: "Payment processed successfully! Thank you for your purchase. Check your Stripe dashboard to confirm.",
            success: true,
            paymentId: payment.id,
            amount: amount,
            currency: "USD",
            status: payment.status,
            customerEmail: customerInfo?.email || null,
            timestamp: new Date().toISOString(),
            liveMode: true,
            dashboardUrl: "https://dashboard.stripe.com/payments"
        });
    } catch (error) {
        console.error("Stripe LIVE Payment Error:", error);

        let errorMessage = "Payment failed. Please try again.";

        if (error.type === 'StripeCardError') {
            errorMessage = `Card Error: ${error.message}`;
        } else if (error.type === 'StripeInvalidRequestError') {
            errorMessage = "Invalid payment information provided.";
        } else if (error.type === 'StripeAPIError') {
            errorMessage = "Payment service temporarily unavailable.";
        } else if (error.type === 'StripeConnectionError') {
            errorMessage = "Network error. Please check your connection.";
        } else if (error.type === 'StripeAuthenticationError') {
            errorMessage = "Payment configuration error - please contact support.";
        } else if (error.code === 'authentication_required') {
            errorMessage = "Additional authentication required for this payment method.";
        }

        res.status(400).json({
            message: errorMessage,
            success: false,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stripeErrorType: error.type,
            stripeErrorCode: error.code
        });
    }
});





// ************************************************************


app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRouter);
app.use('/api', checkoutRoutes);
app.use('/api/questions', questionRoutes);

app.get('/api/products-protected', verifyAuth, (req, res) => {
    res.json({ message: 'This is a protected route. You are authenticated!' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
        browserId: req.headers['x-browser-id'] || 'unknown'
    });
});

app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        browserId: req.headers['x-browser-id'] || 'unknown'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Health Check: http://localhost:${PORT}/health`);
    console.log(`Browser-Specific Cart API: http://localhost:${PORT}/api/cart`);
    console.log(`Stripe Configuration: http://localhost:${PORT}/api/config/stripe`);
    console.log(`User Authentication API: http://localhost:${PORT}/api/auth/register`);
    console.log(`Users List API: http://localhost:${PORT}/api/users (NOW PUBLIC)`);
    console.log(`Contact Info API: http://localhost:${PORT}/api/contact-info`);
    console.log(`No login required for cart - Cart tied to browser/device`);
    console.log(`Hybrid storage: localStorage + MongoDB for persistence`);

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
        console.error("WARNING: Stripe keys not properly configured!");
        console.error("Please check your .env file for STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY");
    } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_') || !process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
        console.error("WARNING: Stripe keys appear to be swapped!");
        console.error("STRIPE_SECRET_KEY should start with 'sk_'");
        console.error("STRIPE_PUBLISHABLE_KEY should start with 'pk_'");
    } else {
        console.log("Stripe LIVE integration ready");
        console.log("Payments will be processed in LIVE mode");
        console.log("Check your Stripe Dashboard for payments: https://dashboard.stripe.com/payments");
    }
});

// --- Graceful Shutdown ---
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// --- Scheduled Tasks ---
const cleanupOldCarts = async () => {
    try {
        const Cart = mongoose.models.Cart || mongoose.model('Cart', new mongoose.Schema({ /* ... cart schema ... */ }));
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Cart.deleteMany({
            lastActivity: { $lt: thirtyDaysAgo }
        });
        console.log(`Cleaned up ${result.deletedCount} old carts`);
    } catch (error) {
        console.error('Error cleaning up old carts:', error);
    }
};

// Run cleanup every 24 hours
setInterval(cleanupOldCarts, 24 * 60 * 60 * 1000);