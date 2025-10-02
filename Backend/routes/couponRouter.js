const express = require("express");
const router = express.Router();
const Coupon = require("../models/CouponModel");

// ✅ Seed default coupon (optional)
async function seedDefaultCoupon() {
    const existing = await Coupon.findOne({ code: "Halstonbtc" });
    if (!existing) {
        await Coupon.create({
            code: "Halstonbtc",
            discountType: "percentage",
            discountValue: 10,
            minOrderAmount: 0,
            maxDiscountAmount: null,
            expiryDate: null,
            usageLimit: null,
            usedCount: 0,
            isActive: true,
            description: "Special 10% discount"
        });
        console.log("✅ Default coupon inserted: Halstonbtc");
    }
}
seedDefaultCoupon();

// ==========================
// POST /validate
// ==========================
router.post("/validate", async (req, res) => {
    let { code, orderAmount } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            message: "⚠️ Coupon code is required"
        });
    }

    code = code.trim().toUpperCase();

    try {
        const coupon = await Coupon.findOne({ code, isActive: true });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: "❌ Invalid coupon code"
            });
        }

        // Check expiry date
        if (coupon.expiryDate && new Date() > coupon.expiryDate) {
            return res.status(400).json({
                success: false,
                message: "❌ Coupon has expired"
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "❌ Coupon usage limit reached"
            });
        }

        // Check minimum order amount
        if (orderAmount && orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `❌ Minimum order of $${coupon.minOrderAmount.toFixed(2)} required`
            });
        }

        // Calculate discount preview (optional - for frontend display)
        let discountPreview = 0;
        if (orderAmount) {
            if (coupon.discountType === 'percentage') {
                discountPreview = (orderAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscountAmount && discountPreview > coupon.maxDiscountAmount) {
                    discountPreview = coupon.maxDiscountAmount;
                }
            } else {
                discountPreview = Math.min(coupon.discountValue, orderAmount);
            }
        }

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscountAmount: coupon.maxDiscountAmount,
                description: coupon.description,
                discountPreview: discountPreview
            }
        });

    } catch (err) {
        console.error("Coupon validation error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
module.exports = router;
