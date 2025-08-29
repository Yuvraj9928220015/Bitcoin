// server.js

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const Stripe = require("stripe");
const path = require('path');
const nodemailer = require('nodemailer');
dotenv.config();
const session = require('express-session');
const MongoStore = require('connect-mongo');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import routes
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const contactRouter = require('./routes/contactRoutes');
const registerRoutes = require('./routes/RegisterRoutes');


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();


app.use(cors({
	origin: 'http://localhost:5173',
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

app.set('trust proxy', true);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/Bitcoine";

// Validation logs
console.log("=== STRIPE CONFIGURATION CHECK ===");
console.log("Secret Key configured:", !!process.env.STRIPE_SECRET_KEY);
console.log("Secret Key starts with sk_:", process.env.STRIPE_SECRET_KEY?.startsWith('sk_'));
console.log("Publishable Key configured:", !!process.env.STRIPE_PUBLISHABLE_KEY);
console.log("Publishable Key starts with pk_:", process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_'));
console.log("Environment:", process.env.NODE_ENV);
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass configured:", !!process.env.EMAIL_PASS);

if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
	console.error("CRITICAL ERROR: STRIPE_SECRET_KEY should start with 'sk_'");
	console.error("Current value starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 10));
}

if (!process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_')) {
	console.error("CRITICAL ERROR: STRIPE_PUBLISHABLE_KEY should start with 'pk_'");
	console.error("Current value starts with:", process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 10));
}

mongoose.connect(MONGO_URL)
	.then(() => {
		console.log("Mongoose Connected to MongoDB");
		console.log(`Connected to database: ${mongoose.connection.name}`);
	})
	.catch(error => console.error("Database Connection Error:", error));

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
		console.log('Session ID:', req.sessionID);
		console.log('Browser ID:', req.browserInfo.browserId);
		console.log('User Agent:', req.browserInfo.userAgent.substring(0, 50) + '...');

		if (req.path.includes('/cart')) {
			console.log('🛒Cart route accessed');
		}
	}
	next();
});

console.log("Nodemailer transporter configured:", !!transporter);

app.get('/api/config/stripe', (req, res) => {
	console.log("Frontend requesting Stripe config...");
	console.log("Returning publishable key:", process.env.STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + '...');

	res.json({
		publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
	});
});

app.get('/', (req, res) => res.send('Bitcoine API is running - LIVE Stripe Integration Active!'));

app.get('/health', (req, res) => {
	res.json({
		status: 'OK',
		mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
		session: req.session ? 'Active' : 'Inactive',
		sessionId: req.sessionID,
		browserSupported: !!req.headers['user-agent'],
		cartSystem: 'Browser-Specific (No Login Required)',
		stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHable_KEY,
		stripeMode: process.env.STRIPE_SECRET_KEY?.includes('_live_') ? 'LIVE' : 'TEST',
		timestamp: new Date().toISOString()
	});
});

app.get('/api/browser-info', (req, res) => {
	res.json({
		browserId: req.headers['x-browser-id'] || 'not-provided',
		sessionId: req.sessionID,
		isNewSession: req.session.isNew,
		userAgent: req.browserInfo.userAgent.substring(0, 100),
		platform: req.browserInfo.platform,
		timestamp: new Date().toISOString()
	});
});

app.post("/api/payment", async (req, res) => {
	let { amount, id, browserId, customerInfo, items, note } = req.body;

	console.log("=== LIVE PAYMENT REQUEST ===");
	console.log("Amount:", amount);
	console.log("Payment Method ID:", id);
	console.log("Customer:", customerInfo?.firstName, customerInfo?.lastName);
	console.log("Items count:", items?.length);

	if (!amount || !id) {
		return res.status(400).json({
			message: "Amount and payment ID are required.",
			success: false
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

		const payment = await stripe.paymentIntents.create({
			amount: amount,
			currency: "USD",
			description: `Bitcoine Jewelry Purchase - Order for ${customerInfo?.email || 'customer'}`,
			payment_method: id,
			confirm: true,
			automatic_payment_methods: {
				enabled: true,
				allow_redirects: "never"
			},
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
					subject: `Order Confirmation - Payment Successful #${payment.id.substring(-8)}`,
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
		console.error("❌ Stripe LIVE Payment Error:", error);

		let errorMessage = "Payment failed. Please try again.";

		// Handle specific Stripe errors
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

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/contact', contactRouter);
app.use('/api/auth', registerRoutes);

app.use((err, req, res, next) => {
	console.error('Error:', err);
	res.status(500).json({
		message: 'Something went wrong!',
		error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
		browserId: req.headers['x-browser-id'] || 'unknown'
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		message: 'Route not found',
		browserId: req.headers['x-browser-id'] || 'unknown'
	});
});

process.on('SIGTERM', async () => {
	console.log('SIGTERM received. Shutting down gracefully...');
	try {
		await mongoose.connection.close();
		console.log('MongoDB connection closed.');
		process.exit(0);
	} catch (error) {
		console.error('Error closing MongoDB connection:', error);
		process.exit(1);
	}
});

process.on('SIGINT', async () => {
	console.log('SIGINT received. Shutting down gracefully...');
	try {
		await mongoose.connection.close();
		console.log('MongoDB connection closed.');
		process.exit(0);
	} catch (error) {
		console.error('Error closing MongoDB connection:', error);
		process.exit(1);
	}
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
	console.log(`API Health Check: http://localhost:${PORT}/health`);
	console.log(`Browser-Specific Cart API: http://localhost:${PORT}/api/cart`);
	console.log(`Stripe Configuration: http://localhost:${PORT}/api/config/stripe`);
	console.log(`User Authentication API: http://localhost:${PORT}/api/auth/register`); // New Auth endpoint
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

// Cleanup function for old carts
const cleanupOldCarts = async () => {
	try {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const result = await mongoose.model('Cart').deleteMany({
			lastActivity: { $lt: thirtyDaysAgo }
		});
		console.log(`Cleaned up ${result.deletedCount} old carts`);
	} catch (error) {
		console.error('❌ Error cleaning up old carts:', error);
	}
};

setInterval(cleanupOldCarts, 24 * 60 * 60 * 1000);