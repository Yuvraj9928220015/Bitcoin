const nodemailer = require('nodemailer');

const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER || process.env.EMAIL_USER,
            pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
        },
    })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;

const BRAND_NAME = process.env.BRAND_NAME || 'Bitcoin Butik';
const SITE_URL = process.env.SITE_URL || 'https://bitcoinbutik.com';
const ADMIN_EMAIL = process.env.EMAIL_RECEIVER || process.env.ADMIN_EMAIL;

function formatMoney(amount, currency = 'USD') {
    const symbol = currency === 'USD' ? '$' : `${currency} `;
    return `${symbol}${Number(amount || 0).toFixed(2)}`;
}

function formatItemVariant(item) {
    const parts = [];
    if (item.size) parts.push(`Size: ${item.size}`);
    if (item.type) parts.push(`Type: ${item.type}`);
    return parts.length ? ` (${parts.join(', ')})` : '';
}

function buildOrderEmailHtml(order, { isAdmin = false } = {}) {
    const {
        orderNumber,
        customerInfo = {},
        items = [],
        subtotal = 0,
        discountAmount = 0,
        finalTotal = 0,
        couponUsed,
        paymentMethod,
        stripeChargeId,
        speedPaymentId,
        note,
        createdAt,
    } = order;

    const fullName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();

    const addressBlock = `
        ${fullName}<br/>
        ${customerInfo.streetAddress1 || ''}${customerInfo.streetAddress2 ? `, ${customerInfo.streetAddress2}` : ''}<br/>
        ${customerInfo.city || ''}, ${customerInfo.state || ''} ${customerInfo.zip || ''}<br/>
        ${customerInfo.countryName || customerInfo.country || ''}
    `;

    const itemsHtml = items.map((item) => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
                <img src="${item.image || ''}" width="50" height="70" style="object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:12px;" alt="${item.name || ''}" />
                <span style="vertical-align:middle;">${item.name || ''}${formatItemVariant(item)} &times; ${item.quantity}</span>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap;">
                ${formatMoney(item.price * item.quantity)}
            </td>
        </tr>
    `).join('');

    const paymentLabel = paymentMethod === 'bitcoin_lightning' ? 'Bitcoin Lightning' : 'Credit / Debit Card';
    const heading = isAdmin ? 'You have received a new order!' : 'Thank you for your order!';
    const subheading = isAdmin
        ? `Order placed by ${fullName} (${customerInfo.email || ''})`
        : `We're getting your order ready to be shipped. We will notify you when it has been sent.`;

    return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
        <table width="100%" style="margin-bottom:20px;">
            <tr>
                <td style="font-size:20px;font-weight:600;">${BRAND_NAME}</td>
                <td style="text-align:right;color:#888;font-size:13px;">ORDER #${orderNumber || ''}</td>
            </tr>
        </table>

        <h2 style="margin-bottom:4px;">${heading}</h2>
        <p style="color:#666;margin-top:0;">${subheading}</p>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

        <h3 style="font-size:15px;color:#333;margin-bottom:10px;">Order Summary</h3>
        <table width="100%" style="border-collapse:collapse;font-size:14px;">
            ${itemsHtml}
        </table>

        <table width="100%" style="font-size:14px;margin-top:12px;">
            <tr><td>Subtotal</td><td style="text-align:right;">${formatMoney(subtotal)}</td></tr>
            <tr><td>Shipping</td><td style="text-align:right;">${formatMoney(0)}</td></tr>
            <tr><td>Taxes</td><td style="text-align:right;">${formatMoney(0)}</td></tr>
            ${discountAmount > 0 ? `<tr><td>Discount${couponUsed ? ` (${couponUsed})` : ''}</td><td style="text-align:right;color:#28a745;">-${formatMoney(discountAmount)}</td></tr>` : ''}
        </table>

        <table width="100%" style="font-size:16px;font-weight:bold;border-top:2px solid #333;margin-top:8px;padding-top:8px;">
            <tr><td>Total</td><td style="text-align:right;">${formatMoney(finalTotal)}</td></tr>
        </table>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />

        <h3 style="font-size:15px;margin-bottom:10px;">Customer Information</h3>
        <table width="100%" style="font-size:14px;">
            <tr>
                <td style="vertical-align:top;width:50%;padding-right:10px;">
                    <strong>Shipping Address</strong><br/>${addressBlock}
                </td>
                <td style="vertical-align:top;width:50%;">
                    <strong>Billing Address</strong><br/>${addressBlock}
                </td>
            </tr>
        </table>

        <table width="100%" style="font-size:14px;margin-top:16px;">
            <tr>
                <td style="vertical-align:top;width:50%;">
                    <strong>Payment Method</strong><br/>${paymentLabel}
                </td>
                <td style="vertical-align:top;width:50%;">
                    <strong>Shipping Method</strong><br/>Standard Shipping
                </td>
            </tr>
        </table>

        ${note ? `
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-size:14px;"><strong>Note:</strong> ${note}</p>
        ` : ''}

        ${isAdmin ? `
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-size:13px;color:#888;line-height:1.6;">
            Email: ${customerInfo.email || ''}<br/>
            Phone: ${customerInfo.phone || ''}<br/>
            Payment ref: ${stripeChargeId || speedPaymentId || ''}<br/>
            Placed at: ${new Date(createdAt || Date.now()).toLocaleString()}
        </p>
        ` : ''}

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="text-align:center;color:#999;font-size:12px;">
            ${BRAND_NAME} &middot; <a href="${SITE_URL}" style="color:#999;">${SITE_URL.replace('https://', '')}</a>
        </p>
    </div>
    `;
}

function buildOrderEmailText(order, { isAdmin = false } = {}) {
    const {
        orderNumber,
        customerInfo = {},
        items = [],
        subtotal = 0,
        discountAmount = 0,
        finalTotal = 0,
        couponUsed,
        paymentMethod,
    } = order;

    const fullName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
    const paymentLabel = paymentMethod === 'bitcoin_lightning' ? 'Bitcoin Lightning' : 'Credit / Debit Card';

    const lines = [];
    lines.push(isAdmin ? 'You have received a new order!' : 'Thank you for your order!');
    lines.push(`Order #${orderNumber || ''}`);
    lines.push('');
    lines.push('Order Summary:');
    items.forEach((item) => {
        lines.push(`- ${item.name}${formatItemVariant(item)} x${item.quantity} — ${formatMoney(item.price * item.quantity)}`);
    });
    lines.push('');
    lines.push(`Subtotal: ${formatMoney(subtotal)}`);
    lines.push(`Shipping: ${formatMoney(0)}`);
    lines.push(`Taxes: ${formatMoney(0)}`);
    if (discountAmount > 0) {
        lines.push(`Discount${couponUsed ? ` (${couponUsed})` : ''}: -${formatMoney(discountAmount)}`);
    }
    lines.push(`Total: ${formatMoney(finalTotal)}`);
    lines.push('');
    lines.push('Customer Information:');
    lines.push(fullName);
    lines.push(`${customerInfo.streetAddress1 || ''}${customerInfo.streetAddress2 ? `, ${customerInfo.streetAddress2}` : ''}`);
    lines.push(`${customerInfo.city || ''}, ${customerInfo.state || ''} ${customerInfo.zip || ''}`);
    lines.push(customerInfo.countryName || customerInfo.country || '');
    lines.push('');
    lines.push(`Payment Method: ${paymentLabel}`);
    lines.push('Shipping Method: Standard Shipping');
    if (isAdmin) {
        lines.push('');
        lines.push(`Customer email: ${customerInfo.email || ''}`);
        lines.push(`Customer phone: ${customerInfo.phone || ''}`);
    }
    lines.push('');
    lines.push(`${BRAND_NAME} — ${SITE_URL}`);

    return lines.join('\n');
}

async function sendOrderEmails(order) {
    const results = { customer: null, admin: null };
    const fullName = `${order?.customerInfo?.firstName || ''} ${order?.customerInfo?.lastName || ''}`.trim();

    if (order?.customerInfo?.email) {
        try {
            await transporter.sendMail({
                from: `"${BRAND_NAME}" <${FROM_EMAIL}>`,
                to: order.customerInfo.email,
                subject: `Order Confirmed — #${order.orderNumber}`,
                text: buildOrderEmailText(order, { isAdmin: false }),
                html: buildOrderEmailHtml(order, { isAdmin: false }),
            });
            results.customer = 'sent';
            console.log('Customer email sent to', order.customerInfo.email);
        } catch (err) {
            results.customer = 'failed';
            console.error('Customer email failed:', err.message);
        }
    } else {
        console.warn('Customer email not sent — customerInfo.email missing on order');
    }

    if (ADMIN_EMAIL) {
        try {
            await transporter.sendMail({
                from: `"${BRAND_NAME} Orders" <${FROM_EMAIL}>`,
                to: ADMIN_EMAIL,
                subject: `New Order #${order.orderNumber} — ${fullName} — ${formatMoney(order.finalTotal)}`,
                text: buildOrderEmailText(order, { isAdmin: true }),
                html: buildOrderEmailHtml(order, { isAdmin: true }),
            });
            results.admin = 'sent';
            console.log('Admin email sent to', ADMIN_EMAIL);
        } catch (err) {
            results.admin = 'failed';
            console.error('Admin email failed:', err.message);
        }
    } else {
        console.warn('Admin email NOT sent — set EMAIL_RECEIVER (ya ADMIN_EMAIL) in .env');
    }

    return results;
}

module.exports = { transporter, sendOrderEmails, buildOrderEmailHtml, buildOrderEmailText, formatMoney };