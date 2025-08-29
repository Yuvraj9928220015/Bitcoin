import "./Contact.css"
import { BiMessageDetail } from "react-icons/bi";
import { BiPhoneCall } from "react-icons/bi";
import { FaWhatsapp } from "react-icons/fa6";
import { IoMdChatbubbles } from "react-icons/io";
import { useState } from "react";
import Discover from "../Home/Discover/Discover";

export default function Contact() {
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        country: '',
        subject: '',
        message: '',
        newsletter: false,
        privacy: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);

        const { firstName, lastName, email, phone, country, subject, message } = formData;
        const postData = {
            firstName,
            lastName,
            email,
            phone,
            country,
            subject,
            message
        };

        try {
            const API_URL = 'http://localhost:9000/api/contact';

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }

            console.log('Form submission successful:', result);
            alert('Message sent successfully!');

            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                country: '',
                subject: '',
                message: '',
                newsletter: false,
                privacy: false
            });
            setShowForm(false);

        } catch (error) {
            console.error('Submission failed:', error);
            alert(`Failed to send message: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showContactForm = (e) => {
        e.preventDefault();
        setShowForm(true);
    };

    const hideContactForm = () => {
        setShowForm(false);
    };

    return (
        <>
            <div className="Contact">
                {!showForm ? (
                    <div className="contact-us-info">
                        <div className="container">
                            <div className="contact-us-info-title">Contact us</div>
                            <div className="row">
                                <div className="col-lg-4 col-md-4 col-sm-12 col-12">
                                    <div className="Contact-Box">
                                        <div className="Contact-Box-title">Chat with us</div>
                                        <div className="Contact-Box-des">
                                            Chat now with our expert Digital Client Advisors to get instant answers and support. Monday to Friday
                                            from 8am to 8pm EST and on Saturdays from 10am to 6pm EST.
                                        </div>
                                        <div className="Contact-Box-link">
                                            <a href="#"><IoMdChatbubbles /> CHAT WITH US OFFLINE</a>
                                            <a href="#"><FaWhatsapp /> WHATSAPP CHAT</a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-4 col-sm-12 col-12">
                                    <div className="Contact-Box">
                                        <div className="Contact-Box-title">Call us</div>
                                        <div className="Contact-Box-des">
                                            Our Digital Client Advisors are excited to provide personalized assistance for any inquiries you might have.
                                            We are ready to assist in English, Mandarin and Italian. Monday to Friday from 8am to 8pm EST
                                            and on Saturdays from 10am to 6pm EST.
                                        </div>
                                        <div className="Contact-Box-link">
                                            <a href="#"><BiPhoneCall /> CALL NOW</a>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-4 col-sm-12 col-12">
                                    <div className="Contact-Box">
                                        <div className="Contact-Box-title">E-message</div>
                                        <div className="Contact-Box-des">
                                            Send us a message and ask us to contact you. Our expert Digital Client Advisors
                                            will gladly respond to your requests within 2-3 business days.
                                        </div>
                                        <div className="Contact-Box-link">
                                            <a href="#"><i className="fa fa-envelope-o" aria-hidden="true"></i> US_CC@BVLGARI.COM</a>
                                            <a href="#" onClick={showContactForm}><BiMessageDetail /> WEB MESSAGE</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="contact-form-section">
                        <div className="container">
                            <div className="form-header">
                                <h2>Contact us</h2>
                                <button className="back-btn" onClick={hideContactForm}>
                                    <i className="fa fa-arrow-left" aria-hidden="true"></i> Back
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First name *</label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">Last name *</label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">Email address *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone number</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="country">Country of residence *</label>
                                    <select
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                    >
                                        <option value="">Please select</option>
                                        <option value="US">United States</option>
                                        <option value="CA">Canada</option>
                                        <option value="UK">United Kingdom</option>
                                        <option value="FR">France</option>
                                        <option value="DE">Germany</option>
                                        <option value="IT">Italy</option>
                                        <option value="ES">Spain</option>
                                        <option value="JP">Japan</option>
                                        <option value="CN">China</option>
                                        <option value="IN">India</option>
                                        <option value="AU">Australia</option>
                                        <option value="BR">Brazil</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject *</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        required
                                    >
                                        <option value="">Please select a subject</option>
                                        <option value="product-inquiry">Product Inquiry</option>
                                        <option value="order-status">Order Status</option>
                                        <option value="customer-service">Customer Service</option>
                                        <option value="technical-support">Technical Support</option>
                                        <option value="feedback">Feedback</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        rows="5"
                                        placeholder="Please enter your message here"
                                        required
                                    ></textarea>
                                </div>

                                <div className="checkbox-group">
                                    <div className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            id="newsletter"
                                            name="newsletter"
                                            checked={formData.newsletter}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                        />
                                        <label htmlFor="newsletter">
                                            I consent to receive marketing communications from Bitcoin Butik regarding their products and services via email and post. I understand that I can withdraw my consent at any time.
                                        </label>
                                    </div>
                                    <div className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            id="privacy"
                                            name="privacy"
                                            checked={formData.privacy}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            required
                                        />
                                        <label htmlFor="privacy">
                                            I agree to the processing and storing of my personal data by Bitcoin Butik for the purposes detailed above and have read and understood the <a href="#" target="_blank">Privacy Policy</a> and <a href="#" target="_blank">Terms of Service</a>. *
                                        </label>
                                    </div>

                                    <div className="textarea-group">
                                        <label htmlFor="">Disclaimer</label>
                                        <textarea
                                            name=""
                                            id=""
                                            placeholder="Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quaerat iusto vel laudantium ducimus nam alias sit quis impedit esse numquam quo eius doloribus, eum suscipit reprehenderit, sed nesciunt quibusdam. Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quaerat iusto vel laudantium ducimus nam alias sit quis impedit esse numquam quo eius doloribus, eum suscipit reprehenderit, sed nesciunt quibusdam Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quaerat iusto vel laudantium ducimus nam alias sit quis impedit esse numquam quo eius doloribus, eum suscipit reprehenderit, sed nesciunt quibusdam"
                                            readOnly
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={hideContactForm}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Appointment Section */}
                <div className="Appointment">
                    <div className="Appointment_container">
                        <div className="Appointment_box Appointment_image">
                            <div className="Appointment_box_Image">
                                <img src="/Bzero13-2.webp" alt="Bvlgari Boutique Interior" />
                            </div>
                        </div>
                        <div className="Appointment_box Appointment_content">
                            <div className="Appointment_info">
                                <div className="Appointment_title">Book an appointment</div>
                                <div className="Appointment_description">
                                    Come and visit us in your favorite <b>Bitcoin Butik</b> or book a virtual appointment,
                                    directly from your home.
                                </div>
                                <div className="Appointment_links">
                                    <a href="#" className="appointment-btn virtual-btn">
                                        <i className="fa fa-video-camera" aria-hidden="true"></i>
                                        VIRTUAL APPOINTMENT
                                    </a>
                                    <a href="#" className="appointment-btn person-btn">
                                        <BiMessageDetail />
                                        IN-PERSON APPOINTMENT
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Discover />
            </div>
        </>
    )
}