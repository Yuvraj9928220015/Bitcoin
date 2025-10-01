import React, { useState } from 'react';
import './Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you for subscribing with: ${email}`);
    setEmail('');
  };

  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Info */}
          <div className="footer-brand">
            <a href="/"><img src="/bitcoine.png" alt="Bitcoin Jewellery Logo" className="footer-logo" /></a>
            <div className="footer-name">Bitcoin Jewellery</div>
            <p className="footer-brand-tagline">Premier Name in Bitcoin Jewellery</p>
          </div>

          {/* Useful Links */}
          <div className="footer-links">
            <h3 className="footer-section-title">Useful Links</h3>
            <ul>
              <li><a href="/NewArrival">New Arrival</a></li>
              <li><a href="/About">About Us</a></li>
              <li><a href="/Return">Return and Exchange Policy</a></li>
              <li><a href="/FAQ">FAQ's</a></li>
              <li><a href="/Privacy">Privacy Policy</a></li>
              <li><a href="/Terms">Terms and Conditions</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="footer-newsletter">
            <h3 className="footer-section-title">Subscribe Now</h3>
            <p className="footer-newsletter-text">
              Register here for our newsletter to receive updates on new releases and discover how our jewelry can help you signal your Bitcoin Statement.
            </p>
            <form onSubmit={handleSubmit} className="newsletter-form">
              <label htmlFor="email-input" className="email-label">Email</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                required
                className="newsletter-input"
              />
              <button type="submit" className="newsletter-button">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="footer-copyright-bar">
        <p>2025. bitcoinbutik ALL rights Reserved</p>
        <p>Developed By lensclickerdigital.com</p>
      </div>
    </footer>
  );
}