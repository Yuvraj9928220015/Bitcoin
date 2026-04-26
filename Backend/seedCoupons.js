const mongoose = require('mongoose');
const Coupon = require('./models/CouponModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

const couponsToSeed = [
    {
        code: 'NATALIE', // 10% off
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: null,
        expiryDate: null,
        usageLimit: null,
        isActive: true,
        description: 'Special 10% discount for NATALIE'
    },
    {
        code: 'BIGSAVE',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 100,
        maxDiscountAmount: 40,
        expiryDate: null,
        usageLimit: null,
        isActive: true,
        description: '25% off with max $40 discount on orders over $100'
    },
    {
        code: 'WELCOME15', // 15% off for new customers, single use
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 25,
        maxDiscountAmount: 25,
        expiryDate: null,
        usageLimit: 1,
        isActive: true,
        description: '15% off for new customers (one-time use, max $25)'
    },
    {
        code: 'FREESHIP', // Fixed $5 off as a "free shipping" equivalent
        discountType: 'fixed',
        discountValue: 5,
        minOrderAmount: 30,
        maxDiscountAmount: null,
        expiryDate: null,
        usageLimit: null,
        isActive: true,
        description: 'Fixed $5 discount on orders over $30 (can be used for shipping)'
    }
];

async function seedCoupons() {
    try {
        console.log('Starting coupon seeding process...');
        await Coupon.deleteMany({});
        console.log('🗑️ Existing coupons deleted.');

        await Coupon.insertMany(couponsToSeed);
        console.log('✅ Coupons added successfully!');

        const allCoupons = await Coupon.find();
        console.log('\n📋 All Coupons in Database:');
        allCoupons.forEach(coupon => {
            console.log(`- Code: ${coupon.code}, Type: ${coupon.discountType}, Value: ${coupon.discountValue}, Min Order: ${coupon.minOrderAmount}, Max Discount: ${coupon.maxDiscountAmount || 'N/A'}, Expiry: ${coupon.expiryDate ? coupon.expiryDate.toLocaleDateString() : 'N/A'}, Used: ${coupon.usedCount}/${coupon.usageLimit || 'Unlimited'}, Active: ${coupon.isActive}`);
        });

        console.log('Coupon seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding coupons:', error);
        process.exit(1);
    }
}

seedCoupons();