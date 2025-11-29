// routes/couponRoutes.js
const express = require("express");
const router = express.Router();
const Coupon = require("../models/CouponModel");


async function seedDefaultCoupon() {
    const existing = await Coupon.findOne({ code: "HOLIDAY10" });
    if (!existing) {
        await Coupon.create({
            code: "HOLIDAY10",
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
        console.log("✅ Default coupon inserted: HOLIDAY10");
    }

    // SAVE20 - Fixed $10 off on orders over $50, expires in 1 year, 100 uses
    const existingFixed = await Coupon.findOne({ code: "SAVE20" });
    if (!existingFixed) {
        await Coupon.create({
            code: "SAVE20",
            discountType: "fixed",
            discountValue: 10,
            minOrderAmount: 50,
            maxDiscountAmount: null,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 100,
            usedCount: 0,
            isActive: true,
            description: "Save $10 on orders over $50"
        });
        console.log("✅ Default coupon inserted: SAVE20");
    }

    // BIGSAVE - 25% off with max $40 discount on orders over $100
    const existingMaxDiscount = await Coupon.findOne({ code: "BIGSAVE" });
    if (!existingMaxDiscount) {
        await Coupon.create({
            code: "BIGSAVE",
            discountType: "percentage",
            discountValue: 25,
            minOrderAmount: 100,
            maxDiscountAmount: null,
            expiryDate: null,
            usageLimit: null,
            usedCount: 0,
            isActive: true,
            description: "25% off with max $40 discount on orders over $100"
        });
        console.log("✅ Default coupon inserted: BIGSAVE");
    }

    // FREESHIP - Free shipping (fixed $0 discount, can be used for free shipping logic on frontend)
    const existingFreeShip = await Coupon.findOne({ code: "FREESHIP" });
    if (!existingFreeShip) {
        await Coupon.create({
            code: "FREESHIP",
            discountType: "fixed",
            discountValue: 10,
            minOrderAmount: 30,
            maxDiscountAmount: null,
            expiryDate: null,
            usageLimit: 500,
            usedCount: 0,
            isActive: true,
            description: "Free shipping on orders over $30"
        });
        console.log("✅ Default coupon inserted: FREESHIP");
    }

    // WINTER15 - 15% off with an expiry date next month
    const existingWinter15 = await Coupon.findOne({ code: "WINTER15" });
    if (!existingWinter15) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        await Coupon.create({
            code: "WINTER15",
            discountType: "percentage",
            discountValue: 15,
            minOrderAmount: 0,
            maxDiscountAmount: null,
            expiryDate: nextMonth,
            usageLimit: null,
            usedCount: 0,
            isActive: true,
            description: "15% off all winter items, expires next month"
        });
        console.log("✅ Default coupon inserted: WINTER15");
    }

    // FLASH50 - Fixed $50 off on orders over $200 (limited time, high discount)
    const existingFlash50 = await Coupon.findOne({ code: "FLASH50" });
    if (!existingFlash50) {
        const twoDaysLater = new Date();
        twoDaysLater.setDate(twoDaysLater.getDate() + 2);
        await Coupon.create({
            code: "FLASH50",
            discountType: "fixed",
            discountValue: 30,
            minOrderAmount: 200,
            maxDiscountAmount: null,
            expiryDate: twoDaysLater,
            usageLimit: 50,
            usedCount: 0,
            isActive: true,
            description: "Flash sale: $50 off on orders over $200"
        });
        console.log("✅ Default coupon inserted: FLASH50");
    }
}
seedDefaultCoupon();


// ==========================
// Validates a single coupon code
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

        if (coupon.expiryDate && new Date() > coupon.expiryDate) {
            return res.status(400).json({
                success: false,
                message: "❌ Coupon has expired"
            });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "❌ Coupon usage limit reached"
            });
        }

        if (orderAmount && orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `❌ Minimum order of $${coupon.minOrderAmount.toFixed(2)} required`
            });
        }

        let discountPreview = 0;
        if (orderAmount !== undefined && orderAmount !== null) {
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
                discountPreview: parseFloat(discountPreview.toFixed(2))
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

// ==========================
// GET /
// Get all coupons (Admin)
// ==========================

router.get("/", async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).json({ success: false, message: "Failed to fetch coupons." });
    }
});

// ==========================
// POST /
// Create a new coupon (Admin)
// ==========================
router.post("/", async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit, description, isActive } = req.body;

        const newCoupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate: expiryDate || null,
            usageLimit: usageLimit || null,
            description,
            isActive: isActive !== undefined ? isActive : true
        });

        await newCoupon.save();
        res.status(201).json({ success: true, message: "Coupon created successfully!", coupon: newCoupon });
    } catch (error) {
        console.error("Error creating coupon:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Coupon code already exists." });
        }
        res.status(500).json({ success: false, message: "Failed to create coupon." });
    }
});

// ==========================
// PUT /:id
// Update a coupon (Admin)
// ==========================
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit, description, isActive } = req.body;

        const updatedCoupon = await Coupon.findByIdAndUpdate(id, {
            code: code ? code.toUpperCase() : undefined,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            expiryDate: expiryDate === '' ? null : expiryDate,
            usageLimit: usageLimit === '' ? null : usageLimit,
            description,
            isActive
        }, { new: true, runValidators: true });

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.status(200).json({ success: true, message: "Coupon updated successfully!", coupon: updatedCoupon });
    } catch (error) {
        console.error("Error updating coupon:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Coupon code already exists." });
        }
        res.status(500).json({ success: false, message: "Failed to update coupon." });
    }
});

// ==========================
// DELETE /:id
// Delete a coupon (Admin)
// ==========================
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.status(200).json({ success: true, message: "Coupon deleted successfully!" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ success: false, message: "Failed to delete coupon." });
    }
});


module.exports = router;