import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Filter, MoreHorizontal, Star, Calendar, RefreshCw } from 'lucide-react';
import './Admin.css';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [activeCategory, setActiveCategory] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedType, setSelectedType] = useState('All');

    // Mock data for products
    const [products] = useState([
        {
            id: 1,
            title: "OnePlus Nord N30 5G | Unlocked Dual SIM Android Smart Phone | 6.7\" LCD",
            sku: "HYS480",
            stock: "In Stock",
            stockCount: 25,
            price: "$250",
            categories: ["Electronics"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 2,
            title: "Socket Mobile Charging Dock",
            sku: "ES480",
            stock: "In Stock",
            stockCount: 25,
            price: "$50.50",
            categories: ["Electronics"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 3,
            title: "Mielle Organics Rosemary Mint Scalp & Hair Strengthening Oil With Biotin & Essential Oils",
            sku: "XZ25",
            stock: "Stock Out",
            stockCount: 0,
            price: "$9.20",
            categories: ["Beauty"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 4,
            title: "Bath & Body Works eGift",
            sku: "0024Y",
            stock: "In Stock",
            stockCount: 25,
            price: "$25",
            categories: ["Finance"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 5,
            title: "Essentials Men's Quarter-Zip Polar Fleece Jacket",
            sku: "HYS480",
            stock: "In Stock",
            stockCount: 25,
            price: "$15.80",
            categories: ["Fashion"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 6,
            title: "Essentials Men's Quarter-Zip Polar Fleece Jacket",
            sku: "HYS480",
            stock: "Stock Low",
            stockCount: 5,
            price: "$15.80",
            categories: ["Fashion"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        },
        {
            id: 7,
            title: "Furniws Turn-N-Tube 5 Tier Corner Display Rack Multipurpose Shelving Unit, 1-Pack, Dark Walnut",
            sku: "154X",
            stock: "In Stock",
            stockCount: 25,
            price: "$25",
            categories: ["Kitchen"],
            type: "Goods",
            tags: ["Top rated", "Best", "Popular", "Phone"],
            rate: 4.2,
            date: "03/12/2023",
            lastEdited: "Last Edited"
        }
    ]);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        setLoginError('');

        // Simulate API call
        setTimeout(() => {
            if (loginData.email === 'admin@admin.com' && loginData.password === 'admin') {
                setIsAuthenticated(true);
                setLoginData({ email: '', password: '' });
                setActiveCategory('products');
            } else {
                setLoginError('Invalid credentials. Use admin@admin.com / admin');
            }
            setIsLoggingIn(false);
        }, 1000);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setActiveCategory('dashboard');
    };

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const getStockColor = (stock) => {
        switch (stock) {
            case 'In Stock': return 'stock-in-stock';
            case 'Stock Out': return 'stock-out';
            case 'Stock Low': return 'stock-low';
            default: return 'stock-default';
        }
    };

    const ProductManagement = () => (
        <div className="product-management">
            <div className="product-stats">
                <div className="stats-item">
                    <span>Products: <span className="stats-number">All (1254)</span></span>
                </div>
            </div>

            <div className="table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>PRODUCT TITLE</th>
                            <th>SKU</th>
                            <th>STOCK</th>
                            <th>PRICE</th>
                            <th>CATEGORIES</th>
                            <th>TYPE</th>
                            <th>TAGS</th>
                            <th>RATE</th>
                            <th>DATE</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className="table-row">
                                <td className="product-title">
                                    <div className="title-text">{product.title}</div>
                                </td>
                                <td className="product-sku">{product.sku}</td>
                                <td>
                                    <span className={`stock-badge ${getStockColor(product.stock)}`}>
                                        {product.stock} ({product.stockCount})
                                    </span>
                                </td>
                                <td className="product-price">{product.price}</td>
                                <td>
                                    <span className="category-link">
                                        {product.categories.join(', ')}
                                    </span>
                                </td>
                                <td className="product-type">{product.type}</td>
                                <td>
                                    <div className="tags-container">
                                        {product.tags.slice(0, 3).map((tag, index) => (
                                            <span key={index} className="tag-link">
                                                {tag}{index < Math.min(product.tags.length, 3) - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className="rating-container">
                                        <Star className="rating-star" />
                                        <span className="rating-number">{product.rate}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="date-container">
                                        <p className="date-main">{product.date}</p>
                                        <p className="date-sub">{product.lastEdited}</p>
                                    </div>
                                </td>
                                <td>
                                    <button className="action-button">
                                        <MoreHorizontal className="action-icon" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Other management components
    const UserManagement = () => (
        <div className="content-section">
            <h2 className="section-title">Users Management</h2>
            <p className="section-text">User management content goes here.</p>
        </div>
    );

    const OrderManagement = () => (
        <div className="content-section">
            <h2 className="section-title">Order Management</h2>
            <p className="section-text">Order management content goes here.</p>
        </div>
    );

    const ContactManagement = () => (
        <div className="content-section">
            <h2 className="section-title">Contact Management</h2>
            <p className="section-text">Contact management content goes here.</p>
        </div>
    );

    const PaymentManagement = () => (
        <div className="content-section">
            <h2 className="section-title">Payment Management</h2>
            <p className="section-text">Payment management content goes here.</p>
        </div>
    );

    const Statistics = () => (
        <div className="content-section">
            <h2 className="section-title">Statistics</h2>
            <p className="section-text">Statistics content goes here.</p>
        </div>
    );

    const Reviews = () => (
        <div className="content-section">
            <h2 className="section-title">Reviews</h2>
            <p className="section-text">Reviews content goes here.</p>
        </div>
    );

    const DefaultDashboard = () => (
        <div className="content-section">
            <h2 className="section-title">Dashboard Overview</h2>
            <p className="section-text">Welcome to the admin dashboard. Select a category from the sidebar to begin.</p>
        </div>
    );

    const renderContent = () => {
        switch (activeCategory) {
            case 'dashboard':
                return <DefaultDashboard />;
            case 'products':
                return <ProductManagement />;
            case 'orders':
                return <OrderManagement />;
            case 'statistics':
                return <Statistics />;
            case 'reviews':
                return <Reviews />;
            case 'customers':
                return <UserManagement />;
            case 'transactions':
                return <PaymentManagement />;
            case 'settings':
                return <ContactManagement />;
            default:
                return <DefaultDashboard />;
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1 className="login-title">Admin Panel Login</h1>
                        <p className="login-subtitle">Use: admin@admin.com / admin</p>
                    </div>
                    <div className="login-form">
                        {loginError && (
                            <div className="login-error">
                                {loginError}
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your email"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your password"
                                className="form-input"
                            />
                        </div>
                        <button
                            onClick={handleLogin}
                            className={`login-btn ${isLoggingIn ? 'loading' : ''}`}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">

                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li>
                            <button
                                onClick={() => setActiveCategory('dashboard')}
                                className={`nav-button ${activeCategory === 'dashboard' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">📊</span>
                                <span>Dashboard</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('products')}
                                className={`nav-button ${activeCategory === 'products' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">📦</span>
                                <span>Products</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('orders')}
                                className={`nav-button ${activeCategory === 'orders' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">🛒</span>
                                <span>Orders</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('statistics')}
                                className={`nav-button ${activeCategory === 'statistics' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">📈</span>
                                <span>Contact</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('reviews')}
                                className={`nav-button ${activeCategory === 'reviews' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">⭐</span>
                                <span>User</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('settings')}
                                className={`nav-button ${activeCategory === 'settings' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">⚙️</span>
                                <span>Settings</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveCategory('profile')}
                                className={`nav-button ${activeCategory === 'profile' ? 'active' : ''}`}
                            >
                                <span className="nav-icon">👤</span>
                                <span>Profile</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="main-header">


                </header>

                {/* Content */}
                <main className="content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Admin;