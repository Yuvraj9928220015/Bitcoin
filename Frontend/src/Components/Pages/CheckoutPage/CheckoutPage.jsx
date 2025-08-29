import { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import {
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { BsPencil } from 'react-icons/bs';
import { TbTruckDelivery } from 'react-icons/tb';
import { RiCoupon3Line } from 'react-icons/ri';
import { CiLock } from "react-icons/ci";
import { useCart } from '../../context/CartContext';
import './CheckoutPage.css';

const API_URL = 'http://localhost:9000';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "16px",
            "::placeholder": {
                color: "#aab7c4",
            },
        },
        invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
        },
    },
};

const CheckoutPage = () => {
    const { cartItems, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();

    const shippingCost = cartItems.length > 0 ? 15.00 : 0;
    const tax = subtotal * 0.08; // 8% tax

    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [stripeConfig, setStripeConfig] = useState(null);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        country: 'United States (US)',
        streetAddress1: '',
        streetAddress2: '',
        city: '',
        state: 'California',
        zip: '',
        phone: '',
        paymentMethod: 'card'
    });

    const [activeModal, setActiveModal] = useState(null);
    const [note, setNote] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [shippingInfo, setShippingInfo] = useState({
        country: 'United States (US)',
        state: 'California',
        city: '',
        zip: ''
    });

    useEffect(() => {
        const loadStripeConfig = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/config/stripe`);
                setStripeConfig(response.data);
                console.log('✅ Stripe config loaded:', response.data);
            } catch (error) {
                console.error('❌ Failed to load Stripe config:', error);
                setPaymentStatus({
                    status: 'error',
                    message: 'Failed to initialize payment system. Please refresh the page.'
                });
            }
        };

        loadStripeConfig();
    }, []);

    const total = subtotal
    const finalTotal = appliedCoupon ? total - appliedCoupon.discount : total;

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleShippingInfoChange = (e) => {
        const { name, value } = e.target;
        setShippingInfo(prevState => ({ ...prevState, [name]: value }));
    }

    const openModal = (modalName) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    const handleSaveNote = (e) => {
        e.preventDefault();
        console.log("Note saved:", note);
        closeModal();
        alert('Note saved successfully!');
    };

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (couponCode.toLowerCase() === 'save10') {
            setAppliedCoupon({ code: couponCode, discount: subtotal * 0.1 });
            alert(`Coupon "${couponCode}" applied! You saved $${(subtotal * 0.1).toFixed(2)}`);
        } else if (couponCode.toLowerCase() === 'free15') {
            setAppliedCoupon({ code: couponCode, discount: 15 });
            alert(`Coupon "${couponCode}" applied! You saved $15.00`);
        } else if (couponCode.toLowerCase() === 'welcome20') {
            setAppliedCoupon({ code: couponCode, discount: subtotal * 0.2 });
            alert(`Coupon "${couponCode}" applied! You saved $${(subtotal * 0.2).toFixed(2)}`);
        } else {
            alert('❌ Invalid coupon code. Try: SAVE10, FREE15, or WELCOME20');
            setCouponCode('');
            return;
        }
        console.log("Coupon applied:", couponCode);
        setCouponCode('');
        closeModal();
    };

    const handleCalculateShipping = (e) => {
        e.preventDefault();
        console.log("Calculating shipping for:", shippingInfo);

        let calculatedShipping = 15.00;
        if (shippingInfo.state === 'California') {
            calculatedShipping = 10.00;
        } else if (shippingInfo.country === 'Canada') {
            calculatedShipping = 25.00;
        }

        alert(`Shipping calculated: $${calculatedShipping.toFixed(2)} for ${shippingInfo.city}, ${shippingInfo.state}`);
        closeModal();
    };

    const validateForm = () => {
        const requiredFields = ['firstName', 'lastName', 'email', 'streetAddress1', 'city', 'zip', 'phone'];

        for (let field of requiredFields) {
            if (!formData[field].trim()) {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        // Phone validation (basic)
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.phone)) {
            alert('Please enter a valid phone number.');
            return false;
        }

        return true;
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            alert('❌ Your cart is empty! Please add some items before checkout.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        if (!stripe || !elements) {
            console.error("Stripe.js has not loaded yet.");
            alert('❌ Payment system is still loading. Please wait a moment and try again.');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus(null);

        const cardNumberElement = elements.getElement(CardNumberElement);

        try {
            console.log('🔄 Creating payment method...');

            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardNumberElement,
                billing_details: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.streetAddress1,
                        line2: formData.streetAddress2 || null,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.zip,
                        country: 'US',
                    }
                }
            });
            //

            if (error) {
                console.error("[Stripe Error]", error);
                setPaymentStatus({ status: 'error', message: error.message });
                setIsProcessing(false);
                return;
            }

            console.log('✅ Payment method created:', paymentMethod.id);

            const amountInCents = Math.round(finalTotal * 100);
            console.log(`💰 Processing payment: $${finalTotal.toFixed(2)} (${amountInCents} cents)`);

            const browserId = localStorage.getItem('browserId') ||
                sessionStorage.getItem('browserId') ||
                `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const response = await axios.post(`${API_URL}/api/payment`, {
                amount: amountInCents,
                id: paymentMethod.id,
                browserId: browserId,
                items: cartItems,
                customerInfo: formData,
                note: note
            });

            if (response.data.success) {
                console.log("✅ Payment successful!");
                console.log("Payment details:", response.data);

                // Show success alert
                alert(`Payment Successful! 
                
 Payment ID: ${response.data.paymentId}
 Amount: $${(response.data.amount / 100).toFixed(2)}
 Confirmation sent to: ${response.data.customerEmail || formData.email}

Thank you for your purchase! You can check your payment in the Stripe dashboard.`);

                setPaymentStatus({
                    status: 'success',
                    message: 'Payment successful! Thank you for your order.',
                    paymentId: response.data.paymentId,
                    amount: response.data.amount,
                    customerEmail: response.data.customerEmail || formData.email
                });

                clearCart();

                window.scrollTo({ top: 0, behavior: 'smooth' });

            } else {
                console.error("❌ Payment failed on server:", response.data.message);
                alert(`❌ Payment Failed: ${response.data.message}`);
                setPaymentStatus({
                    status: 'error',
                    message: response.data.message || 'Payment failed. Please try again.'
                });
            }
        } catch (serverError) {
            console.error("❌ Error communicating with server:", serverError.response?.data || serverError.message);
            const errorMessage = serverError.response?.data?.message || 'A server error occurred. Please try again later.';
            alert(`❌ Server Error: ${errorMessage}`);
            setPaymentStatus({ status: 'error', message: errorMessage });
        }

        setIsProcessing(false);
    };

    if (paymentStatus?.status === 'success') {
        return (
            <div className="checkout-container">
                <div className="payment-success-message" style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '15px',
                    margin: '2rem auto',
                    maxWidth: '600px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉 Order Complete!</h2>
                    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Thank you for your purchase!</p>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        margin: '1.5rem 0'
                    }}>
                        <p><strong>Payment ID:</strong> {paymentStatus.paymentId}</p>
                        <p><strong>Amount:</strong> ${(paymentStatus.amount / 100).toFixed(2)} USD</p>
                        <p><strong>📧 Confirmation sent to:</strong> {paymentStatus.customerEmail}</p>
                        <p><strong>📅 Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        A confirmation email has been sent to your email address.<br />
                        You can also check your payment in the Stripe dashboard.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            background: 'white',
                            color: '#667eea',
                            border: 'none',
                            padding: '12px 30px',
                            borderRadius: '25px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            marginTop: '1.5rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="checkout-container">
                {/* Show Stripe config status */}
                {!stripeConfig && (
                    <div style={{
                        background: '#fff3cd',
                        color: '#856404',
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: '5px',
                        textAlign: 'center'
                    }}>
                        Loading payment system...
                    </div>
                )}

                <form className="checkout-form" onSubmit={handlePlaceOrder}>
                    <div className="billing-details">
                        <h1>Billing details</h1>
                        <div className="form-row-split">
                            <div className="form-group">
                                <label htmlFor="firstName">First name *</label>
                                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleFormChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last name *</label>
                                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleFormChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email address *</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="country">Country / Region *</label>
                            <select id="country" name="country" value={formData.country} onChange={handleFormChange} required>
                                <option>United States (US)</option>
                                <option>Canada</option>
                                <option>United Kingdom</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="streetAddress1">Street address *</label>
                            <input
                                type="text"
                                id="streetAddress1"
                                name="streetAddress1"
                                placeholder="House number and street name"
                                value={formData.streetAddress1}
                                onChange={handleFormChange}
                                required
                            />
                            <input
                                type="text"
                                id="streetAddress2"
                                name="streetAddress2"
                                placeholder="Apartment, suite, unit, etc. (optional)"
                                value={formData.streetAddress2}
                                onChange={handleFormChange}
                                style={{ marginTop: '10px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">Town / City *</label>
                            <input type="text" id="city" name="city" value={formData.city} onChange={handleFormChange} required />
                        </div>

                        <div className="form-row-split">
                            <div className="form-group">
                                <label htmlFor="state">State *</label>
                                <select id="state" name="state" value={formData.state} onChange={handleFormChange} required>
                                    <option>California</option>
                                    <option>New York</option>
                                    <option>Texas</option>
                                    <option>Florida</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="zip">ZIP Code *</label>
                                <input type="text" id="zip" name="zip" value={formData.zip} onChange={handleFormChange} required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone *</label>
                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} required />
                        </div>
                    </div>

                    <div className="order-details">
                        <div className="order-items">
                            <h2>Your Order</h2>
                            {cartItems.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    background: '#f8f9fa',
                                    borderRadius: '10px',
                                    color: '#6c757d'
                                }}>
                                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🛒 Your cart is empty</p>
                                    <p>Add some items to get started!</p>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.cartId} className="checkout-cart-item">
                                        <img src={item.image} alt={item.name} className="checkout-item-image" />
                                        <div className="checkout-item-details">
                                            <h4>{item.name}</h4>
                                            {item.size && <p>Size: {item.size}</p>}
                                            <div className="checkout-quantity-controls">
                                                <span>Qty:</span>
                                                <button type="button" onClick={() => updateQuantity(item.cartId, -1)} disabled={item.quantity <= 1}>-</button>
                                                <span>{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.cartId, 1)}>+</button>
                                            </div>
                                        </div>
                                        <div className="checkout-item-price-section">
                                            <p className="checkout-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                                            <button type="button" onClick={() => removeFromCart(item.cartId)} className="remove-item-btn">Remove</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="order-summary-box">
                            <div className="order-summary-header">
                                <div className="summary-icon-item" onClick={() => openModal('note')}><BsPencil /><span>Note</span></div>
                                <div className="summary-icon-item" onClick={() => openModal('shipping')}><TbTruckDelivery /><span>Shipping</span></div>
                                <div className="summary-icon-item" onClick={() => openModal('coupon')}><RiCoupon3Line /><span>Coupon</span></div>
                            </div>
                            <div className="order-summary-line">
                                <span>Subtotal ({cartItems.length} items)</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {/* <div className="order-summary-line">
                                <span>Shipping</span>
                                <span>${shippingCost.toFixed(2)}</span>
                            </div>
                            <div className="order-summary-line">
                                <span>Tax (8%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div> */}
                            {appliedCoupon && (
                                <div className="order-summary-line coupon-discount" style={{ color: '#28a745' }}>
                                    <span>💰 Discount ({appliedCoupon.code})</span>
                                    <span>-${appliedCoupon.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="order-summary-line total" style={{
                                borderTop: '2px solid #dee2e6',
                                paddingTop: '1rem',
                                marginTop: '1rem',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                            }}>
                                <span>Total</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="payment-information">
                            <h2>Payment information</h2>
                            <div className={`payment-method ${formData.paymentMethod === 'card' ? 'selected' : ''}`}>
                                <input type="radio" id="card" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleFormChange} />
                                <label htmlFor="card">💳 Credit / Debit Card</label>
                            </div>

                            {formData.paymentMethod === 'card' && (
                                <div className="card-details-form">
                                    <div className="form-group">
                                        <label>Card Details</label>
                                        <div className="card-input-container">
                                            <div className="card-input-row">
                                                <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                                            </div>
                                            <div className="card-input-row-split">
                                                <div className="card-input-half">
                                                    <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                                                </div>
                                                <div className="card-input-half">
                                                    <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentStatus?.status === 'error' && (
                                <div className="payment-error-message" style={{
                                    background: '#f8d7da',
                                    color: '#721c24',
                                    padding: '1rem',
                                    borderRadius: '5px',
                                    margin: '1rem 0',
                                    border: '1px solid #f5c6cb'
                                }}>
                                    ❌ {paymentStatus.message}
                                </div>
                            )}

                            <p className="privacy-notice">
                                <CiLock /> Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our
                                <a href="/Privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
                            </p>

                            <button
                                type="submit"
                                className="place-order-btn"
                                disabled={isProcessing || !stripe || cartItems.length === 0}
                                style={{
                                    opacity: (isProcessing || !stripe || cartItems.length === 0) ? 0.6 : 1,
                                    cursor: (isProcessing || !stripe || cartItems.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isProcessing ? (
                                    "🔄 Processing Payment..."
                                ) : cartItems.length === 0 ? (
                                    "Add items to cart"
                                ) : !stripe ? (
                                    "Loading payment system..."
                                ) : (
                                    `💳 Place order (${finalTotal.toFixed(2)})`
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* --- Modals --- */}
                {activeModal && (
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={closeModal}>×</button>
                            {activeModal === 'note' && (
                                <form onSubmit={handleSaveNote}>
                                    <h2>📝 Add a Note</h2>
                                    <textarea
                                        className="modal-textarea"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add special instructions, gift message, or any other notes..."
                                        rows="5"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            resize: 'vertical'
                                        }}
                                    ></textarea>
                                    <button type="submit" className="modal-btn">Save Note</button>
                                </form>
                            )}
                            {/* Shipping Modal Content */}
                            {activeModal === 'shipping' && (
                                <form onSubmit={handleCalculateShipping}>
                                    <h2>🚛 Calculate Shipping</h2>
                                    <select
                                        name="country"
                                        value={shippingInfo.country}
                                        onChange={handleShippingInfoChange}
                                        className="modal-input"
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        <option>United States (US)</option>
                                        <option>Canada</option>
                                    </select>
                                    <select
                                        name="state"
                                        value={shippingInfo.state}
                                        onChange={handleShippingInfoChange}
                                        className="modal-input"
                                        style={{ marginBottom: '1rem' }}
                                    >
                                        <option>California</option>
                                        <option>New York</option>
                                        <option>Texas</option>
                                        <option>Florida</option>
                                    </select>
                                    <input
                                        type="text"
                                        name="city"
                                        value={shippingInfo.city}
                                        onChange={handleShippingInfoChange}
                                        placeholder="City"
                                        className="modal-input"
                                        style={{ marginBottom: '1rem' }}
                                    />
                                    <input
                                        type="text"
                                        name="zip"
                                        value={shippingInfo.zip}
                                        onChange={handleShippingInfoChange}
                                        placeholder="ZIP / Postal Code"
                                        className="modal-input"
                                        style={{ marginBottom: '1rem' }}
                                    />
                                    <button type="submit" className="modal-btn">Update Shipping</button>
                                </form>
                            )}
                            {/* Coupon Modal Content */}
                            {activeModal === 'coupon' && (
                                <form onSubmit={handleApplyCoupon}>
                                    <h2>🎫 Enter Coupon Code</h2>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter your coupon code"
                                        style={{
                                            marginBottom: '1rem',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                    <div style={{
                                        background: '#f8f9fa',
                                        padding: '1rem',
                                        borderRadius: '5px',
                                        marginBottom: '1rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        <p><strong>Available Coupons:</strong></p>
                                        <p>• SAVE10 - 10% off your order</p>
                                        <p>• FREE15 - $15 off any order</p>
                                        <p>• WELCOME20 - 20% off for new customers</p>
                                    </div>
                                    <button type="submit" className="modal-btn">Apply Coupon</button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CheckoutPage;