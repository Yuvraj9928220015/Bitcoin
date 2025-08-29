import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { CiMenuFries, CiSearch, CiHeart } from "react-icons/ci";
import { TbUser } from "react-icons/tb";
import { SlHandbag } from "react-icons/sl";
import { IoClose } from "react-icons/io5";
import { FaEye, FaEyeSlash, FaHeart, FaGem, FaBoxOpen, FaRegClock } from "react-icons/fa"; // Import FaEyeSlash
import { GoDash, GoPlus } from "react-icons/go";
import './Navbar.css';
import AddedToCartNotification from '../context/AddedToCartNotification';

const ShoppingCartPage = ({ isOpen, closeCart, items, subtotal, updateQuantity, removeFromCart }) => {
    if (!isOpen) return null;

    const handleQuantityUpdate = (itemCartId, amount) => {
        console.log(`Updating quantity for item: ${itemCartId} by amount: ${amount}`);
        updateQuantity(itemCartId, amount);
    };

    const handleRemoveItem = (itemCartId) => {
        console.log(`Removing item: ${itemCartId}`);
        removeFromCart(itemCartId);
    };

    return (
        <div className="shopping-page-overlay">
            <button className="shopping-page-close-btn" onClick={closeCart} aria-label="Close cart">
                <IoClose />
            </button>

            <div className="shopping-page-container">
                <main className="shopping-page-main">
                    <div className="shopping-page-header-main">
                        <h1 className="shopping-page-title">Shopping bag</h1>
                    </div>

                    {items.length === 0 ? (
                        <div className="cart-empty" style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <p>Your shopping bag is empty.</p>
                            <p>Start shopping to add items to your cart!</p>
                        </div>
                    ) : (
                        items.map(item => {
                            const itemId = item.cartItemId || item.cartId;

                            return (
                                <div className="cart-item-full" key={itemId}>
                                    <div className="cart-item-full-image">
                                        <img src={item.image} alt={item.name} />
                                    </div>
                                    <div className="cart-item-full-details">
                                        <p className="item-name">{item.name}</p>
                                        {item.size && <p className="item-size">Size: {item.size}</p>}
                                        <div className="quantity-control-page">
                                            <span>Quantity: {item.quantity}</span>
                                            <div>
                                                <button
                                                    onClick={() => handleQuantityUpdate(itemId, -1)}
                                                    aria-label="Decrease quantity"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => handleQuantityUpdate(itemId, 1)}
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <p className="item-price">
                                            ${(item.price * item.quantity).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </p>
                                        <button className="item-remove" onClick={() => handleRemoveItem(itemId)}>
                                            REMOVE
                                        </button>
                                    </div>
                                    <div className="cart-item-full-code">
                                        <span>Product ID: {item.productId}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </main>

                <aside className="order-summary-sidebar">
                    <div className="summary-box">
                        <h2 className="summary-title">Order Summary</h2>
                        <div className="summary-line">
                            <span>Subtotal ({items.length} items)</span>
                            <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <p className="summary-note-taxes">Excluding shipping and taxes</p>
                        <Link
                            to="/CheckoutPage"
                            className="complete-purchase-btn"
                            onClick={closeCart}
                            disabled={items.length === 0}
                        >
                            COMPLETE PURCHASE
                        </Link>
                        <ul className="summary-info-list">
                            <li>Complimentary standard shipping within 2 to 4 working days. Personalization may add up to 7-10 business days.</li>
                            <li>Complimentary "Click & Collect" option available from all our Boutiques in the US. Your online order will be sent to your selected Boutique within 3 to 4 working days.</li>
                            <li>You may return a piece that you purchased online for an exchange or a refund, within 30 days from the date of delivery.</li>
                            <li>Perfumes and personalized orders cannot be returned.</li>
                            <li>We do not ship to PO boxes, UPS locations, Freight Forwarders or hotels.</li>
                            <li>Signature required on all purchases over $300.</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

const Navbar = () => {
    const {
        cartCount, isCartOpen, openCart, closeCart, cartItems, subtotal,
        updateQuantity, removeFromCart, addedItemNotification, closeAddedToCartNotification
    } = useCart();

    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSubMenu, setActiveSubMenu] = useState('Womans Pendants');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupConfirmEmail, setSignupConfirmEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [newsletterAgreed, setNewsletterAgreed] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [loginError, setLoginError] = useState('')
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [signupTitle, setSignupTitle] = useState('')
    const [signupFirstName, setSignupFirstName] = useState('')
    const [signupLastName, setSignupLastName] = useState('')
    const [signupCountry, setSignupCountry] = useState('United States');

    // Password visibility states
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);


    // User authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
    const [isInsideBvlgariOpen, setIsInsideBvlgariOpen] = useState(false);
    const [isPendantsOpen, setIsPendantsOpen] = useState(false);

    const womansPendantsData = {
        collections: [
            { name: 'Digital Gold Pendant', image: '/Bzero5-1.webp' },
            { name: 'HODL & Shine Pendant', image: '/Bzero10-2.webp' },
            { name: 'Bitcoin Blade Pendant', image: '/DSC07226.JPG' },
            { name: 'Your Keys Pendant', image: '/Man-Banner-1.JPG' },
        ]
    };

    const mansPendantsData = {
        collections: [
            { name: 'Liberty Pendant', image: '/DSC07223.JPG' },
            { name: 'Bitcoin Blade Pendant', image: '/DSC07226.JPG' },
            { name: 'Your Keys Pendant', image: '/Man-Banner-1.JPG' }
        ]
    };

    const ringsData = {
        collections: [
            { name: 'Bitcoin Pure Silver Ring', image: '/NewArrivals-3.webp' },
            { name: 'Bitcoin Eternal Spark Ring', image: '/Ring-1.webp' }
        ]
    };

    const earringsData = {
        collections: [
            { name: 'Bitcoin Eternal Spark Earrings', image: '/Earrings-1.webp' },
            { name: 'Bitcoin Eternal Spark Earrings', image: '/Earrings-2.webp' },
            { name: 'Bitcoin Standard Earrings', image: '/Earrings-Banner.webp' },
        ]
    };

    const braceletsData = {
        collections: [
            { name: 'Bitcoin Eternal Spark Bracelet', image: '/DSC02926.webp' }
        ]
    };

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            setIsAuthenticated(true);
            fetchUserData(token);
        }
    }, []);

    const fetchUserData = async (token) => {
        try {
            const response = await fetch('http://localhost:9000/api/auth/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setUser(data.user);
            } else {
                console.error("Failed to fetch user data:", data.message);
                // If token is invalid, clear it
                Cookies.remove('token');
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            Cookies.remove('token');
            setIsAuthenticated(false);
            setUser(null);
        }
    };


    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

    const toggleLogin = () => {
        setIsLoginOpen(!isLoginOpen);
        setIsSignupOpen(false); // Close signup if opening login
        setLoginError(''); // Clear any previous errors
        setShowLoginPassword(false); // Reset password visibility
    };

    const toggleSignup = () => {
        setIsSignupOpen(!isSignupOpen);
        setIsLoginOpen(false); // Close login if opening signup
        setSignupError(''); // Clear any previous errors
        setShowSignupPassword(false); // Reset password visibility
        setShowSignupConfirmPassword(false); // Reset confirm password visibility
    };

    const handleMenuLinkClick = (menuName) => {
        if (menuName) {
            setActiveSubMenu(menuName);
        }
    };

    const closeMenuAndNavigate = () => {
        setIsMenuOpen(false);
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(''); // Clear previous errors

        try {
            const response = await fetch('http://localhost:9000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Cookies.set('token', data.token, { expires: 7 }); // Store token for 7 days
                setIsAuthenticated(true);
                setUser(data.user);
                setLoginEmail('');
                setLoginPassword('');
                setIsLoginOpen(false);
                alert(data.message); // "Logged in successfully!"
                navigate('/'); // Navigate to home page or dashboard
            } else {
                setLoginError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error("Login API error:", error);
            setLoginError('Network error or server unavailable. Please try again.');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError(''); // Clear previous errors

        if (signupPassword !== signupConfirmPassword) {
            setSignupError('Passwords do not match.');
            return;
        }

        if (signupEmail !== signupConfirmEmail) {
            setSignupError('Emails do not match.');
            return;
        }

        if (!termsAgreed) {
            setSignupError('You must agree to the privacy information to create an account.');
            return;
        }

        try {
            const response = await fetch('http://localhost:9000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: signupTitle,
                    firstName: signupFirstName,
                    lastName: signupLastName,
                    country: signupCountry,
                    email: signupEmail,
                    password: signupPassword,
                    termsAgreed,
                    newsletterAgreed
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                Cookies.set('token', data.token, { expires: 7 }); // Store token
                setIsAuthenticated(true);
                setUser(data.user);
                // Clear form fields
                setSignupTitle('');
                setSignupFirstName('');
                setSignupLastName('');
                setSignupCountry('United States');
                setSignupEmail('');
                setSignupConfirmEmail('');
                setSignupPassword('');
                setSignupConfirmPassword('');
                setTermsAgreed(false);
                setNewsletterAgreed(false);
                setIsSignupOpen(false);
                alert(data.message); // "User registered successfully!"
                navigate('/'); // Navigate to home page or dashboard
            } else {
                setSignupError(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error("Signup API error:", error);
            setSignupError('Network error or server unavailable. Please try again.');
        }
    };

    const handleLogout = () => {
        Cookies.remove('token'); // Remove token
        setIsAuthenticated(false);
        setUser(null);
        alert('You have been logged out.');
        navigate('/'); // Navigate to home page
    };


    const renderSubMenuContent = () => {
        let dataToShow = [];

        switch (activeSubMenu) {
            case 'Mans Pendants':
                dataToShow = mansPendantsData.collections;
                break;
            case 'Rings':
                dataToShow = ringsData.collections;
                break;
            case 'Earrings':
                dataToShow = earringsData.collections;
                break;
            case 'Bracelets':
                dataToShow = braceletsData.collections;
                break;
            case 'Womans Pendants':
            default:
                dataToShow = womansPendantsData.collections;
                break;
        }

        return (
            <div className="featured-grid">
                {dataToShow.map((item, index) => (
                    <div key={index} className="featured-item" onClick={closeMenuAndNavigate}>
                        <img src={item.image} alt={item.name} />
                        <h4>{item.name}</h4>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <AddedToCartNotification
                item={addedItemNotification}
                onClose={closeAddedToCartNotification}
            />

            <div className="app">
                <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                    <div className="navbar-container">
                        <button className="menu-btn" onClick={toggleMenu}>
                            <CiMenuFries /> Menu
                        </button>
                        <div className="logo">
                            <Link to="/">
                                <span className="logo-text">
                                    <img src="/bitcoine.png" alt="logo" />
                                </span>
                            </Link>
                        </div>
                        <div className="navbar-icons">
                            {window.innerWidth > 768 && (
                                <button className="icon-btn" onClick={toggleSearch}>
                                    <CiSearch />
                                </button>
                            )}
                            {window.innerWidth > 768 && (
                                <button className="icon-btn">
                                    <CiHeart />
                                </button>
                            )}
                            {isAuthenticated ? (
                                <button className="icon-btn" onClick={handleLogout}>
                                    <div className='icon-btn-User'>
                                        <TbUser />
                                        <span className="username-text">
                                            ({user ? user.firstName : 'Guest'})
                                        </span>
                                    </div>
                                </button>
                            ) : (
                                <button className="icon-btn" onClick={toggleLogin}>
                                    <TbUser />
                                </button>
                            )}
                            <button className="icon-btn cart-btn" onClick={openCart}>
                                <SlHandbag />
                                {cartCount > 0 && (
                                    <span className="cart-count">{cartCount}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                {isSearchOpen && (
                    <div className="search-fullscreen-overlay">
                        <button className="search-close-btn" onClick={toggleSearch}>
                            <IoClose /> Close
                        </button>
                        <div className="search-fullscreen-container">
                            <CiSearch className="search-input-icon" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-fullscreen-input"
                                autoFocus
                            />
                        </div>
                        <div className="search-suggestions">
                            <p>POPULAR SEARCHES</p>
                            <Link to="/rings" onClick={toggleSearch}>B.zero1</Link>
                            <Link to="#" onClick={toggleSearch}>Octo Finissimo</Link>
                            <Link to="#" onClick={toggleSearch}>Engagement rings</Link>
                        </div>
                    </div>
                )}

                <div className={`sidebar-menu ${isMenuOpen ? 'open' : ''}`}>
                    <div className="sidebar-header">
                        <button className="close-btn" onClick={toggleMenu}>
                            <IoClose /> Close
                        </button>
                    </div>
                    <div className="menu-layout">
                        <div className="menu-left-pane">
                            <div className="menu-section">
                                <h3 className="menu-section-header" onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}>
                                    <span>COLLECTIONS</span>
                                    {isCollectionsOpen ? <GoDash /> : <GoPlus />}
                                </h3>
                                {isCollectionsOpen && (
                                    <ul className="menu-main-list">
                                        <li className={activeSubMenu.includes('Pendants') ? 'active' : ''}>
                                            <div className="menu-item-with-dropdown" onClick={() => setIsPendantsOpen(!isPendantsOpen)}>
                                                <span>Pendants</span>
                                                <span>{isPendantsOpen ? <GoDash /> : <GoPlus />}</span>
                                            </div>
                                            {isPendantsOpen && (
                                                <ul className="submenu-list">
                                                    <li onClick={() => handleMenuLinkClick('Womans Pendants')}>
                                                        <Link to="/Pendants" onClick={closeMenuAndNavigate}>Womans</Link>
                                                    </li>
                                                    <li onClick={() => handleMenuLinkClick('Mans Pendants')}>
                                                        <Link to="/Man" onClick={closeMenuAndNavigate}>Mans</Link>
                                                    </li>
                                                </ul>
                                            )}
                                        </li>
                                        <li onClick={() => handleMenuLinkClick('Rings')} className={activeSubMenu === 'Rings' ? 'active' : ''}>
                                            <Link to="/Rings" onClick={closeMenuAndNavigate}>Rings</Link>
                                        </li>
                                        <li onClick={() => handleMenuLinkClick('Earrings')} className={activeSubMenu === 'Earrings' ? 'active' : ''}>
                                            <Link to="/Earrings" onClick={closeMenuAndNavigate}>Earrings</Link>
                                        </li>
                                        <li onClick={() => handleMenuLinkClick('Bracelets')} className={activeSubMenu === 'Bracelets' ? 'active' : ''}>
                                            <Link to="/Bracelets" onClick={closeMenuAndNavigate}>Bracelets</Link>
                                        </li>
                                    </ul>
                                )}
                            </div>
                            <div className="menu-section">
                                <h3 className="menu-section-header" onClick={() => setIsInsideBvlgariOpen(!isInsideBvlgariOpen)}>
                                    <span>INSIDE BITCOIN BUTIK</span>
                                    {isInsideBvlgariOpen ? <GoDash /> : <GoPlus />}
                                </h3>
                                {isInsideBvlgariOpen && (
                                    <ul className="menu-main-list">
                                        <li onClick={() => handleMenuLinkClick('About')}>
                                            <Link to="/About" onClick={closeMenuAndNavigate}>About Us</Link>
                                        </li>
                                        <li>
                                            <Link to="/contact" onClick={closeMenuAndNavigate}>Contact Us</Link>
                                        </li>
                                    </ul>
                                )}
                            </div>

                        </div>
                        <div className="menu-right-pane">{renderSubMenuContent()}</div>
                    </div>
                </div>

                <ShoppingCartPage
                    isOpen={isCartOpen}
                    closeCart={closeCart}
                    items={cartItems}
                    subtotal={subtotal}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                />

                {/* Login Modal */}
                <div className={`login-modal ${isLoginOpen ? 'open' : ''}`}>
                    <div className="login-container">
                        <div className="login-header">
                            <button className="close-btn" onClick={toggleLogin}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="login-content">
                            <h4>Quick Login (Optional)</h4>
                            <p>Login is completely optional. Your cart will be saved automatically for this browser session.</p>
                            <form className="login-form" onSubmit={handleLogin}>
                                {loginError && <p className="error-message" style={{ color: 'red' }}>{loginError}</p>}
                                <div className="form-group">
                                    <label>Email*</label>
                                    <input
                                        type="email"
                                        placeholder="Insert your email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password*</label>
                                    <div className="password-input">
                                        <input
                                            type={showLoginPassword ? "text" : "password"}
                                            placeholder="Insert your password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                            {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-options">
                                    <a href="#" className="forgot-password">Forgot password?</a>
                                    <label className="remember-me">
                                        <input
                                            type="checkbox"
                                            required
                                        />Remember me
                                    </label>
                                </div>
                                <button type="submit" className="login-submit">LOG IN</button>
                            </form>
                            <div className="membership-benefits">
                                <h4>Continue as Guest</h4>
                                <p>No account needed! Your cart is automatically saved for this browser session.</p>
                                <div className="benefits-grid">
                                    <div className="benefit"><FaHeart /><span>No Registration Required</span></div>
                                    <div className="benefit"><FaGem /><span>Instant Shopping</span></div>
                                    <div className="benefit"><FaBoxOpen /><span>Session Cart Storage</span></div>
                                    <div className="benefit"><FaRegClock /><span>Quick Checkout</span></div>
                                </div>
                                <button className="create-account-btn" onClick={toggleSignup}>
                                    CREATE ACCOUNT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signup Modal */}
                <div className={`login-modal ${isSignupOpen ? 'open' : ''}`}>
                    <div className="login-container">
                        <div className="login-header">
                            <h3 className="signup-title">Create new account</h3>
                            <button className="close-btn" onClick={toggleSignup}>
                                <IoClose />
                            </button>
                        </div>
                        <div className="login-content">
                            <p className="signup-intro">
                                Create your account to be part of the Bulgari world,
                                discover our new collections and receive news from the Maison.
                            </p>
                            <form className="signup-form" onSubmit={handleSignup}>
                                {signupError && <p className="error-message" style={{ color: 'red' }}>{signupError}</p>}
                                <div className="form-group">
                                    <label htmlFor="signupTitle">Title</label>
                                    <select
                                        id="signupTitle"
                                        value={signupTitle}
                                        onChange={(e) => setSignupTitle(e.target.value)}
                                    >
                                        <option value="">Insert your title</option>
                                        <option value="Mr">Mr.</option>
                                        <option value="Ms">Ms.</option>
                                        <option value="Mx">Mx.</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupFirstName">First Name*</label>
                                    <input
                                        type="text"
                                        id="signupFirstName"
                                        placeholder="Insert your name"
                                        value={signupFirstName}
                                        onChange={(e) => setSignupFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupLastName">Last Name*</label>
                                    <input
                                        type="text"
                                        id="signupLastName"
                                        placeholder="Insert your last name"
                                        value={signupLastName}
                                        onChange={(e) => setSignupLastName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupCountry">Country/Region*</label>
                                    <select
                                        id="signupCountry"
                                        value={signupCountry}
                                        onChange={(e) => setSignupCountry(e.target.value)}
                                        required
                                    >
                                        <option value="United States">United States</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Mexico">Mexico</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupEmail">Email*</label>
                                    <input
                                        type="email"
                                        id="signupEmail"
                                        placeholder="Insert your email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupConfirmEmail">Confirm Email*</label>
                                    <input
                                        type="email"
                                        id="signupConfirmEmail"
                                        placeholder="Confirm Email"
                                        value={signupConfirmEmail}
                                        onChange={(e) => setSignupConfirmEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupPassword">Password*</label>
                                    <div className="password-input">
                                        <input
                                            type={showSignupPassword ? "text" : "password"}
                                            id="signupPassword"
                                            placeholder="Insert your password"
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                                            {showSignupPassword ? <FaEyeSlash /> : <FaEye />} 
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="signupConfirmPassword">Confirm Password*</label>
                                    <div className="password-input">
                                        <input
                                            type={showSignupConfirmPassword ? "text" : "password"}
                                            id="signupConfirmPassword"
                                            placeholder="Confirm Password"
                                            value={signupConfirmPassword}
                                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}>
                                            {showSignupConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <p className="privacy-info">
                                    Having read and understood the Privacy Information Notice. I declare that I am over 16 years of age and.
                                </p>
                                <div className="form-group checkbox-group">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={termsAgreed}
                                            onChange={(e) => setTermsAgreed(e.target.checked)}
                                            required
                                        />
                                        <span className="checkmark"></span>
                                        I agree to share information regarding my interests, preferences
                                        and purchasing habits (profiling) based on my purchases
                                        made at Bulgari and other LVMH Maisons.
                                    </label>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={newsletterAgreed}
                                            onChange={(e) => setNewsletterAgreed(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        I agree to receive communications regarding new collections,
                                        products, services and events.
                                    </label>
                                </div>
                                <button type="submit" className="login-submit">CREATE ACCOUNT</button>
                                <p className="switch-form-text">
                                    Already have an account? <button type="button" className="switch-form-btn" onClick={toggleLogin}>Log In</button>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

export default Navbar;