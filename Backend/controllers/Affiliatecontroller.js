const nodemailer = require("nodemailer");
const AffiliateApplication = require("../models/AffiliateApplication");

const NOTIFY_EMAIL = "dailyreport015@gmail.com";

// Reuse a single transporter instance (Gmail SMTP, same pattern as JC Drink contact form)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password (not your normal password)
    },
});

function buildAdminEmailHtml(data) {
    const row = (label, value) =>
        `<tr><td style="padding:6px 12px;color:#8a8a8a;font-size:13px;white-space:nowrap;">${label}</td><td style="padding:6px 12px;font-size:14px;">${value || "-"}</td></tr>`;

    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#c9a24b;">New Bitcoin Butik Affiliate Application</h2>
        <table style="width:100%;border-collapse:collapse;">
            ${row("Full Name", data.fullName)}
            ${row("Email", data.email)}
            ${row("Country", data.country)}
            ${row("Phone", data.phone)}
            ${row("Company / Brand", data.company)}
            ${row("Website", data.website)}
            ${row("Primary Channel", data.primaryChannel)}
            ${row("Channel URL", data.channelUrl)}
            ${row("Content Types", (data.contentTypes || []).join(", "))}
            ${row("Promotion Methods", (data.promoteMethods || []).join(", "))}
            ${row("Reason", data.reason)}
            ${row("Currently does affiliate marketing?", data.hasOtherAffiliate)}
            ${row("Other brands promoted", data.otherBrands)}
        </table>
    </div>`;
}

function buildApplicantEmailHtml(data) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#c9a24b;">Thanks for applying, ${data.fullName}!</h2>
        <p style="font-size:15px;color:#333;line-height:1.6;">
            We've received your application to join the <strong>Bitcoin Butik Affiliate Program</strong>.
            Our team will review your details and get back to you shortly with next steps.
        </p>
        <p style="font-size:14px;color:#666;">
            In the meantime, feel free to explore our collections at
            <a href="https://bitcoinbutik.com" style="color:#f7931a;">bitcoinbutik.com</a>.
        </p>
        <p style="font-size:14px;color:#666;">— Team Bitcoin Butik</p>
    </div>`;
}

const submitAffiliateApplication = async (req, res) => {
    try {
        const {
            fullName,
            email,
            country,
            phone,
            company,
            website,
            primaryChannel,
            channelUrl,
            contentTypes,
            promoteMethods,
            reason,
            hasOtherAffiliate,
            otherBrands,
        } = req.body;

        // Basic server-side validation
        if (
            !fullName?.trim() ||
            !email?.trim() ||
            !country?.trim() ||
            !primaryChannel?.trim() ||
            !channelUrl?.trim() ||
            !reason?.trim() ||
            !hasOtherAffiliate?.trim() ||
            !Array.isArray(contentTypes) ||
            contentTypes.length === 0 ||
            !Array.isArray(promoteMethods) ||
            promoteMethods.length === 0
        ) {
            return res.status(400).json({ success: false, message: "Please fill all required fields." });
        }

        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }

        const applicationData = {
            fullName: fullName.trim(),
            email: email.trim(),
            country: country.trim(),
            phone: phone?.trim() || "",
            company: company?.trim() || "",
            website: website?.trim() || "",
            primaryChannel,
            channelUrl: channelUrl.trim(),
            contentTypes,
            promoteMethods,
            reason: reason.trim(),
            hasOtherAffiliate,
            otherBrands: otherBrands?.trim() || "",
        };

        // 1. Save to DB
        const savedApplication = await AffiliateApplication.create(applicationData);

        // 2. Send email to admin/notify address
        const adminMail = transporter.sendMail({
            from: `"Bitcoin Butik Affiliate" <${process.env.EMAIL_USER}>`,
            to: NOTIFY_EMAIL,
            subject: `New Affiliate Application - ${applicationData.fullName}`,
            html: buildAdminEmailHtml(applicationData),
        });

        // 3. Send confirmation email to the applicant
        const applicantMail = transporter.sendMail({
            from: `"Bitcoin Butik" <${process.env.EMAIL_USER}>`,
            to: applicationData.email,
            subject: "We received your Bitcoin Butik affiliate application",
            html: buildApplicantEmailHtml(applicationData),
        });

        await Promise.all([adminMail, applicantMail]);

        return res.status(201).json({
            success: true,
            message: "Application submitted successfully.",
            applicationId: savedApplication._id,
        });
    } catch (error) {
        console.error("Affiliate application error:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while submitting your application. Please try again.",
        });
    }
};

module.exports = { submitAffiliateApplication };