import { useState } from "react";
import "./Universe.css";

export default function Universe() {
    const [email, setEmail] = useState("");
    const [title, setTitle] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [country, setCountry] = useState("United States");
    const [agree, setAgree] = useState(false);

    const [isFormVisible, setIsFormVisible] = useState(false);

    const handleEmailChange = (e) => {
        const currentEmail = e.target.value;
        setEmail(currentEmail);

        const emailRegex = /\S+@\S+\.\S+/;
        if (emailRegex.test(currentEmail)) {
            setIsFormVisible(true);
        } else {
            setIsFormVisible(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({
            email,
            title,
            firstName,
            lastName,
            phone,
            country,
            agree,
        });
        alert("Subscription details submitted! Check the console.");
        
    };


    return (
        <>
            <div className="Universe">
                <div className="container">
                    <div className="universe-container">
                        <form className="universe-form" onSubmit={handleSubmit}>
                            <h2 className="universe-title">Join the Bvlgari Universe</h2>
                            <p className="universe-subtitle">
                                Get first access to the very best of Bvlgari products, inspiration and services.
                            </p>

                            {/* Email Input */}
                            <div className="form-group full-width">
                                <label htmlFor="email-input">Email*</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    placeholder="Insert your email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    required
                                />
                            </div>

                            {isFormVisible && (
                                <>
                                    <div className="form-group full-width">
                                        <label>Title</label>
                                        <div className="radio-group">
                                            {["Ms.", "Mr.", "Mrs.", "Prefer Not to Say", "Mx"].map((t) => (
                                                <label key={t} className="radio-label">
                                                    <input
                                                        type="radio"
                                                        name="title"
                                                        value={t}
                                                        checked={title === t}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                    />
                                                    {t}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="first-name">First Name*</label>
                                            <input
                                                id="first-name"
                                                type="text"
                                                placeholder="Insert your name"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="last-name">Last Name*</label>
                                            <input
                                                id="last-name"
                                                type="text"
                                                placeholder="Insert your last name"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="phone">Phone number</label>
                                            <input
                                                id="phone"
                                                type="tel"
                                                placeholder="Insert your phone number"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="country">Country/Region*</label>
                                            <select id="country" value={country} onChange={(e) => setCountry(e.target.value)} required>
                                                <option>United States</option>
                                                <option>Canada</option>
                                                <option>United Kingdom</option>
                                                <option>Australia</option>
                                            </select>
                                        </div>
                                    </div>

                                    <p className="privacy-text">
                                        By signing up via text, you agree to receive recurring automated and personalized marketing text messages (e.g cart reminders) from Bvlgari on the phone number provided. You can unsubscribe at any time by replying STOP via text or HELP for support. Msg frequency varies. Msg and data rates may apply.
                                    </p>
                                    <p className="privacy-text">
                                        Having read and understood the <a href="#">Privacy Information Notice</a> I declare that I am over 16 years of age and I would like to receive information about Bvlgari creations and services. The Maison may contact you via email, text, phone, social media or through online advertising. You can unsubscribe at any time.
                                    </p>

                                    <div className="checkbox-group">
                                        <label>You Can Also (Optional)</label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                                            I agree to share information regarding my interests, preferences and purchasing habits (profiling) based on my purchases made at Bvlgari and other LVMH Maisons.
                                        </label>
                                    </div>

                                    <p className="required-fields">*Required Fields</p>

                                    <button type="submit" className="subscribe-btn">SUBSCRIBE</button>

                                    <p className="recaptcha-notice">
                                        This site is protected by reCAPTCHA and the Google <a href="#">Privacy Policy</a>. <a href="#">Terms of Service</a> apply.
                                    </p>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}