// seedCoupons.js - Run this once to add coupons to database
const mongoose = require('mongoose');
const Coupon = require('./models/CouponModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

const coupons = [
    {
        code: 'Halstonbtc',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        maxDiscountAmount: null,
        expiryDate: null, // No expiry
        usageLimit: null, // Unlimited usage
        isActive: true,
        description: 'Special 10% discount'
    }
];

async function seedCoupons() {
    try {
        // Delete existing coupons (optional)
        await Coupon.deleteMany({});
        console.log('🗑️  Existing coupons deleted');

        // Insert new coupons
        await Coupon.insertMany(coupons);
        console.log('✅ Coupons added successfully!');
        
        // Display added coupons
        const allCoupons = await Coupon.find();
        console.log('\n📋 All Coupons:');
        allCoupons.forEach(coupon => {
            console.log(`- ${coupon.code}: ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '$' + coupon.discountValue} off`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding coupons:', error);
        process.exit(1);
    }
}

seedCoupons();