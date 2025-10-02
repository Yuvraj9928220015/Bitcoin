const dotenv = require('dotenv');
const express = require('express');
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

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());
app.set('trust proxy', true);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(MONGO_URL)
    .then(() => {
        console.log("✅ Mongoose Connected to MongoDB");
        console.log(`📦 Connected to database: ${mongoose.connection.name}`);
    })
    .catch(error => console.error("❌ Database Connection Error:", error));

const Register = require('./models/Register');
const Coupon = require('./models/CouponModel'); // Import Coupon model

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

// Import Routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const contactRouter = require('./routes/contactRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const registerAuthRoutes = require('./routes/RegisterRoutes');
const questionRoutes = require('./routes/questionRoutes');
const couponRoutes = require('./routes/couponRouter');

// Basic Routes
app.get('/', (req, res) => res.send('Bitcoine API is running - LIVE Stripe Integration Active!'));

app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        session: req.session ? 'Active' : 'Inactive',
        cartSystem: 'Browser-Specific',
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        couponsActive: true,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/browser-info', (req, res) => {
    res.json({
        browserId: req.headers['x-browser-id'] || 'not-provided',
        sessionId: req.sessionID,
        timestamp: new Date().toISOString()
    });
});

// Stripe Configuration
app.get('/api/config/stripe', (req, res) => {
    console.log("✅ Frontend requesting Stripe config");
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// User Auth Routes
app.use('/api/auth', registerAuthRoutes);

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
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
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await User.create({
            title, firstName, lastName, country, email,
            password: hashedPassword, termsAgreed, newsletterAgreed
        });

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            success: true, token,
            user: { id: user._id, firstName: user.firstName, email: user.email }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/verify', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ authenticated: false });
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
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/contact-info', (req, res) => {
    res.status(200).json({
        companyName: "Bitcoine Jewelry",
        email: "support@bitcoine.com",
        phone: "+1 (800) 555-0199",
        address: "123 Gemstone Alley, Jewel City, JC 10001, USA"
    });
});

// ============================================
// PAYMENT ROUTE WITH COUPON SUPPORT
// ============================================
app.post("/api/payment", async (req, res) => {
    let { amount, id, paymentMethodId, browserId, customerInfo, items, note, appliedCoupon } = req.body;

    console.log("=== PAYMENT REQUEST ===");
    console.log("Amount:", amount);
    console.log("Applied Coupon:", appliedCoupon);

    const finalPaymentMethodId = paymentMethodId || id;

    if (!amount || !finalPaymentMethodId) {
        return res.status(400).json({
            message: "Amount and payment method required",
            success: false
        });
    }

    if (amount < 50) {
        return res.status(400).json({
            message: "Minimum amount is $0.50",
            success: false
        });
    }

    try {
        // Calculate subtotal from items
        const serverCalculatedSubtotal = items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        console.log("Server subtotal:", serverCalculatedSubtotal);

        // Validate coupon on backend
        let discountAmount = 0;
        let validatedCoupon = null;

        if (appliedCoupon && appliedCoupon.code) {
            console.log("Validating coupon:", appliedCoupon.code);

            const coupon = await Coupon.findOne({
                code: appliedCoupon.code.toUpperCase(),
                isActive: true
            });

            if (coupon) {
                // Check expiry
                if (coupon.expiryDate && new Date() > coupon.expiryDate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon has expired'
                    });
                }

                // Check usage limit
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon usage limit reached'
                    });
                }

                // Check minimum order
                if (serverCalculatedSubtotal < coupon.minOrderAmount) {
                    return res.status(400).json({
                        success: false,
                        message: `Minimum order of $${coupon.minOrderAmount} required`
                    });
                }

                // Calculate discount
                if (coupon.discountType === 'percentage') {
                    discountAmount = (serverCalculatedSubtotal * coupon.discountValue) / 100;
                    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                        discountAmount = coupon.maxDiscountAmount;
                    }
                } else if (coupon.discountType === 'fixed') {
                    discountAmount = Math.min(coupon.discountValue, serverCalculatedSubtotal);
                }

                validatedCoupon = {
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                    discountAmount: discountAmount
                };

                console.log("✅ Coupon validated:", validatedCoupon);

                // Increment usage count
                await Coupon.findOneAndUpdate(
                    { code: coupon.code },
                    { $inc: { usedCount: 1 } }
                );
            }
        }

        // Recalculate final amount with discount
        const finalTotal = serverCalculatedSubtotal - discountAmount;
        const finalAmountInCents = Math.round(finalTotal * 100);

        console.log("Final amount after discount:", finalTotal);
        console.log("Amount in cents:", finalAmountInCents);

        const payment = await stripe.paymentIntents.create({
            amount: finalAmountInCents,
            currency: "usd",
            description: `Bitcoine Jewelry - ${customerInfo?.email}`,
            payment_method: finalPaymentMethodId,
            confirm: true,
            return_url: "http://localhost:5173/payment-success",
            metadata: {
                browserId: browserId || 'unknown',
                customerName: `${customerInfo?.firstName} ${customerInfo?.lastName}`,
                customerEmail: customerInfo?.email || '',
                couponCode: validatedCoupon ? validatedCoupon.code : 'none',
                discountAmount: discountAmount.toFixed(2),
                originalAmount: serverCalculatedSubtotal.toFixed(2)
            },
            receipt_email: customerInfo?.email || null
        });

        console.log("✅ PAYMENT SUCCESSFUL!");
        console.log("Payment ID:", payment.id);
        console.log("Amount charged:", finalAmountInCents / 100);

        // Send confirmation email
        if (transporter && customerInfo?.email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: customerInfo.email,
                    cc: process.env.EMAIL_RECEIVER,
                    subject: `Order Confirmation #${payment.id.substring(payment.id.length - 8)}`,
                    html: `
                        <h2>Thank you for your order!</h2>
                        <p>Dear ${customerInfo.firstName} ${customerInfo.lastName},</p>
                        <p>Payment: <strong>$${(finalAmountInCents / 100).toFixed(2)}</strong></p>
                        ${validatedCoupon ? `<p>Discount (${validatedCoupon.code}): -$${discountAmount.toFixed(2)}</p>` : ''}
                        <p>Payment ID: ${payment.id}</p>
                        <p>Status: Confirmed</p>
                    `
                });
                console.log("✅ Email sent");
            } catch (emailError) {
                console.error("Email error:", emailError.message);
            }
        }

        res.json({
            message: "Payment successful!",
            success: true,
            paymentId: payment.id,
            amount: finalAmountInCents,
            appliedDiscount: discountAmount > 0 ? {
                code: validatedCoupon.code,
                amount: discountAmount
            } : null
        });

    } catch (error) {
        console.error("Payment Error:", error);
        res.status(400).json({
            message: error.message || "Payment failed",
            success: false
        });
    }
});

// ============================================
// REGISTER ALL ROUTES
// ============================================
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRouter);
app.use('/api', checkoutRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/coupons', couponRoutes); // COUPON ROUTES

app.get('/api/products-protected', verifyAuth, (req, res) => {
    res.json({ message: 'Protected route - authenticated!' });
});

// Error Handlers
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal error'
    });
});

app.use((req, res) => {
    console.log("❌ 404 - Route not found:", req.method, req.path);
    res.status(404).json({
        message: 'Route not found',
        path: req.path
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
    console.log(`🎫 Coupon API: http://localhost:${PORT}/api/coupons`);
    console.log(`💳 Payment: http://localhost:${PORT}/api/payment`);
    console.log(`⚙️  Stripe Config: http://localhost:${PORT}/api/config/stripe\n`);

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("⚠️  WARNING: Stripe keys not configured!");
    } else {
        console.log("✅ Stripe integration ready");
    }
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`);
    try {
        await mongoose.connection.close();
        console.log('MongoDB closed');
        process.exit(0);
    } catch (error) {
        console.error('Error closing MongoDB:', error);
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