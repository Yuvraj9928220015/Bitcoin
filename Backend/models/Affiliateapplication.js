const mongoose = require("mongoose");

const affiliateApplicationSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        country: { type: String, required: true, trim: true },
        phone: { type: String, trim: true, default: "" },
        company: { type: String, trim: true, default: "" },
        website: { type: String, trim: true, default: "" },
        primaryChannel: { type: String, required: true },
        channelUrl: { type: String, required: true, trim: true },
        contentTypes: { type: [String], default: [] },
        promoteMethods: { type: [String], default: [] },
        reason: { type: String, required: true },
        hasOtherAffiliate: { type: String, enum: ["Yes", "No"], required: true },
        otherBrands: { type: String, trim: true, default: "" },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

module.exports =
    mongoose.models.AffiliateApplication ||
    mongoose.model("AffiliateApplication", affiliateApplicationSchema);