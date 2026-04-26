// scripts/createCoupon.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function createCoupon() {
    try {
        const coupon = await stripe.coupons.create({
            id: 'NATALIE',  // coupon code
            percent_off: 10,   // 10% discount
            duration: 'once',  // sirf ek order me use ho
        });
        console.log('Coupon created:', coupon);
    } catch (err) {
        console.error('Error creating coupon:', err);
    }
}

createCoupon();
