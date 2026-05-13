// routes/bitcoinRoutes.js - COMPLETE BITCOIN PAYMENT ROUTES
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// ============================================
// 1. OPENNODE (BTC + Lightning Network)
// ============================================
const OPENNODE_API_KEY = process.env.OPENNODE_API_KEY;
const OPENNODE_API_URL = process.env.OPENNODE_ENV === 'live' 
    ? 'https://api.opennode.com/v1' 
    : 'https://dev-api.opennode.com/v1';

router.post('/opennode/create-charge', async (req, res) => {
    const { amount, couponCode, customerEmail, customerInfo, items } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).send({ error: 'Invalid amount' });
    }

    try {
        const charge = await axios.post(
            `${OPENNODE_API_URL}/charges`,
            {
                amount: amount.toFixed(2),
                currency: 'USD',
                description: 'Bitcoin Payment - Bitcoine Jewelry',
                customer_email: customerEmail || '',
                success_url: 'https://bitcoinbutik.com/payment-success',
                callback_url: 'https://api.bitcoinbutik.com/api/bitcoin/opennode/webhook',
            },
            {
                headers: {
                    'Authorization': OPENNODE_API_KEY,
                    'Content-Type': 'application/json',
                }
            }
        );

        res.send({ 
            gateway: 'OpenNode',
            url: charge.data.data.hosted_checkout_url,
            chargeId: charge.data.data.id,
            status: charge.data.data.status
        });

    } catch (error) {
        console.error("OpenNode Error:", error.response?.data || error.message);
        res.status(500).send({ error: error.response?.data?.message || error.message });
    }
});

router.post('/opennode/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const event = req.body;
        if (event.status === 'paid') {
            console.log(' OpenNode Payment Successful:', event.id);
            // Update your database here
        }
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('OpenNode Webhook Error:', error.message);
        res.status(400).send('Webhook failed');
    }
});

// ============================================
// 2. NOWPAYMENTS (150+ Cryptocurrencies)
// ============================================
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';

router.post('/nowpayments/create-payment', async (req, res) => {
    const { amount, currency = 'btc', customerEmail, customerInfo } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).send({ error: 'Invalid amount' });
    }

    try {
        const paymentResponse = await axios.post(
            `${NOWPAYMENTS_API_URL}/payment`,
            {
                price_amount: amount,
                price_currency: 'usd',
                pay_currency: currency,
                ipn_callback_url: 'https://api.bitcoinbutik.com/api/bitcoin/nowpayments/webhook',
                order_id: `ORDER_${Date.now()}`,
                order_description: 'Bitcoine Jewelry Purchase',
                success_url: 'https://bitcoinbutik.com/payment-success',
                cancel_url: 'https://bitcoinbutik.com/checkout',
            },
            {
                headers: {
                    'x-api-key': NOWPAYMENTS_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send({
            gateway: 'NOWPayments',
            paymentId: paymentResponse.data.payment_id,
            paymentStatus: paymentResponse.data.payment_status,
            payAddress: paymentResponse.data.pay_address,
            payAmount: paymentResponse.data.pay_amount,
            payCurrency: paymentResponse.data.pay_currency,
            invoiceUrl: paymentResponse.data.invoice_url || null
        });

    } catch (error) {
        console.error("NOWPayments Error:", error.response?.data || error.message);
        res.status(500).send({ error: error.response?.data?.message || error.message });
    }
});

router.post('/nowpayments/webhook', express.json(), async (req, res) => {
    try {
        const payload = req.body;
        
        const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET || '');
        hmac.update(JSON.stringify(req.body));
        const signature = hmac.digest('hex');

        if (signature === req.headers['x-nowpayments-sig']) {
            if (payload.payment_status === 'finished') {
                console.log(' NOWPayments Payment Successful:', payload.payment_id);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('NOWPayments Webhook Error:', error.message);
        res.status(400).send('Webhook failed');
    }
});

router.get('/nowpayments/currencies', async (req, res) => {
    try {
        const response = await axios.get(`${NOWPAYMENTS_API_URL}/currencies`, {
            headers: { 'x-api-key': NOWPAYMENTS_API_KEY }
        });
        res.json({ currencies: response.data.currencies });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 3. COINBASE COMMERCE (BTC, ETH, LTC, etc.)
// ============================================
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

router.post('/coinbase/create-charge', async (req, res) => {
    const { amount, customerEmail, customerInfo, items } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).send({ error: 'Invalid amount' });
    }

    try {
        const chargeResponse = await axios.post(
            `${COINBASE_API_URL}/charges`,
            {
                name: 'Bitcoine Jewelry Order',
                description: 'Payment for jewelry items',
                pricing_type: 'fixed_price',
                local_price: {
                    amount: amount.toString(),
                    currency: 'USD'
                },
                metadata: {
                    customer_email: customerEmail,
                    order_id: `ORDER_${Date.now()}`
                },
                redirect_url: 'https://bitcoinbutik.com/payment-success',
                cancel_url: 'https://bitcoinbutik.com/checkout'
            },
            {
                headers: {
                    'X-CC-Api-Key': COINBASE_API_KEY,
                    'X-CC-Version': '2018-03-22',
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send({
            gateway: 'Coinbase Commerce',
            chargeId: chargeResponse.data.data.id,
            hostedUrl: chargeResponse.data.data.hosted_url,
            code: chargeResponse.data.data.code,
            addresses: chargeResponse.data.data.addresses
        });

    } catch (error) {
        console.error("Coinbase Error:", error.response?.data || error.message);
        res.status(500).send({ error: error.response?.data?.error?.message || error.message });
    }
});

router.post('/coinbase/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-cc-webhook-signature'];
        const payload = req.body.toString();

        const expectedSignature = crypto
            .createHmac('sha256', process.env.COINBASE_WEBHOOK_SECRET || '')
            .update(payload)
            .digest('hex');

        if (signature === expectedSignature) {
            const event = JSON.parse(payload);
            
            if (event.event.type === 'charge:confirmed') {
                console.log(' Coinbase Payment Confirmed:', event.event.data.id);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Coinbase Webhook Error:', error.message);
        res.status(400).send('Webhook failed');
    }
});

// ============================================
// 4. COINGATE (70+ Cryptocurrencies)
// ============================================
const COINGATE_API_KEY = process.env.COINGATE_API_KEY;
const COINGATE_API_URL = process.env.COINGATE_ENV === 'live' 
    ? 'https://api.coingate.com/v2' 
    : 'https://api-sandbox.coingate.com/v2';

router.post('/coingate/create-order', async (req, res) => {
    const { amount, currency = 'BTC', customerEmail } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).send({ error: 'Invalid amount' });
    }

    try {
        const orderResponse = await axios.post(
            `${COINGATE_API_URL}/orders`,
            {
                order_id: `ORDER_${Date.now()}`,
                price_amount: amount,
                price_currency: 'USD',
                receive_currency: currency,
                title: 'Bitcoine Jewelry Purchase',
                description: 'Payment for jewelry items',
                callback_url: 'https://api.bitcoinbutik.com/api/bitcoin/coingate/webhook',
                cancel_url: 'https://bitcoinbutik.com/checkout',
                success_url: 'https://bitcoinbutik.com/payment-success',
                purchaser_email: customerEmail
            },
            {
                headers: {
                    'Authorization': `Token ${COINGATE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send({
            gateway: 'CoinGate',
            orderId: orderResponse.data.id,
            status: orderResponse.data.status,
            paymentUrl: orderResponse.data.payment_url,
            payAmount: orderResponse.data.pay_amount,
            payCurrency: orderResponse.data.pay_currency
        });

    } catch (error) {
        console.error("CoinGate Error:", error.response?.data || error.message);
        res.status(500).send({ error: error.response?.data?.message || error.message });
    }
});

router.post('/coingate/webhook', express.json(), async (req, res) => {
    try {
        const event = req.body;
        
        if (event.status === 'paid') {
            console.log(' CoinGate Payment Successful:', event.id);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('CoinGate Webhook Error:', error.message);
        res.status(400).send('Webhook failed');
    }
});

// ============================================
// 5. BTCPAY SERVER (Self-Hosted Option)
// ============================================
const BTCPAY_SERVER_URL = process.env.BTCPAY_SERVER_URL;
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY;
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID;

router.post('/btcpay/create-invoice', async (req, res) => {
    const { amount, customerEmail } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).send({ error: 'Invalid amount' });
    }

    try {
        const invoiceResponse = await axios.post(
            `${BTCPAY_SERVER_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
            {
                amount: amount,
                currency: 'USD',
                metadata: {
                    orderId: `ORDER_${Date.now()}`,
                    buyerEmail: customerEmail
                },
                checkout: {
                    redirectURL: 'https://bitcoinbutik.com/payment-success'
                }
            },
            {
                headers: {
                    'Authorization': `token ${BTCPAY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send({
            gateway: 'BTCPay Server',
            invoiceId: invoiceResponse.data.id,
            checkoutLink: invoiceResponse.data.checkoutLink,
            status: invoiceResponse.data.status
        });

    } catch (error) {
        console.error("BTCPay Error:", error.response?.data || error.message);
        res.status(500).send({ error: error.response?.data?.message || error.message });
    }
});

router.post('/btcpay/webhook', express.json(), async (req, res) => {
    try {
        const event = req.body;
        
        if (event.type === 'InvoiceSettled') {
            console.log(' BTCPay Payment Successful:', event.invoiceId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('BTCPay Webhook Error:', error.message);
        res.status(400).send('Webhook failed');
    }
});

// ============================================
// UNIFIED CRYPTO PAYMENT ENDPOINT
// ============================================
router.post('/create-crypto-payment', async (req, res) => {
    const { gateway, amount, currency, customerEmail, customerInfo, items, couponCode } = req.body;

    console.log(`Creating ${gateway} payment for $${amount}`);

    try {
        let response;

        switch (gateway.toLowerCase()) {
            case 'opennode':
                response = await axios.post(
                    `${req.protocol}://${req.get('host')}/api/bitcoin/opennode/create-charge`,
                    { amount, customerEmail, customerInfo, items, couponCode }
                );
                break;

            case 'nowpayments':
                response = await axios.post(
                    `${req.protocol}://${req.get('host')}/api/bitcoin/nowpayments/create-payment`,
                    { amount, currency, customerEmail, customerInfo }
                );
                break;

            case 'coinbase':
                response = await axios.post(
                    `${req.protocol}://${req.get('host')}/api/bitcoin/coinbase/create-charge`,
                    { amount, customerEmail, customerInfo, items }
                );
                break;

            case 'coingate':
                response = await axios.post(
                    `${req.protocol}://${req.get('host')}/api/bitcoin/coingate/create-order`,
                    { amount, currency, customerEmail }
                );
                break;

            case 'btcpay':
                response = await axios.post(
                    `${req.protocol}://${req.get('host')}/api/bitcoin/btcpay/create-invoice`,
                    { amount, customerEmail, customerInfo }
                );
                break;

            default:
                return res.status(400).json({ error: 'Invalid gateway selected' });
        }

        res.json(response.data);

    } catch (error) {
        console.error(`${gateway} Payment Error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;