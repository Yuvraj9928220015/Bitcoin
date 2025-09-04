// Admin.js
import React, { useState, useEffect } from 'react';
import './Admin.css';

// UserData Component (no changes needed)
const UserData = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:9000/api/users', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (response.status === 401) {
                    throw new Error('You are not authorized. Please log in.');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch user data.');
                }

                const data = await response.json();

                const usersWithDate = data.map(user => ({
                    ...user,
                    registrationDate: new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }),
                    registrationTime: new Date(user.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                    })
                }));

                setUsers(usersWithDate);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="content-section">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading user data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content-section">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3 className="error-title">Error Loading Users</h3>
                    <p className="error-text">{error}</p>
                    <p className="error-subtext">Please ensure you are logged in and have the necessary permissions.</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="content-section">
                <div className="no-data-container">
                    <div className="no-data-icon">👥</div>
                    <h3 className="no-data-title">No Users Found</h3>
                    <p className="no-data-text">No registered users found in the system.</p>
                    <p className="no-data-subtext">Start by registering some users through the registration endpoint.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="content-section">
            <div className="section-header">
                <h1 className="section-title">User Management</h1>
                <div className="section-stats">
                    <div className="stats-item">
                        <span className="stats-number">{users.length}</span>
                        <span className="stats-label">Total Users</span>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Country</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user._id} className="table-row">
                                <td data-label="ID">
                                    <span className="id-badge">{index + 1}</span>
                                </td>
                                <td data-label="Title">
                                    <span className="title-text">{user.title || 'N/A'}</span>
                                </td>
                                <td data-label="First Name">
                                    <span className="name-text">{user.firstName}</span>
                                </td>
                                <td data-label="Last Name">
                                    <span className="name-text">{user.lastName}</span>
                                </td>
                                <td data-label="Email">
                                    <a href={`mailto:${user.email}`} className="email-link">
                                        {user.email}
                                    </a>
                                </td>
                                <td data-label="Country">
                                    <span className="country-text">{user.country}</span>
                                </td>
                                <td data-label="Registration Date">
                                    <div className="date-container">
                                        <div className="date-main">{user.registrationDate}</div>
                                        <div className="date-sub">{user.registrationTime}</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ContactData Component (no changes needed)
const ContactData = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:9000/api/contact', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (response.status === 401) {
                    throw new Error('You are not authorized. Please log in to view contact submissions.');
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch contact data.');
                }

                const data = await response.json();

                const contactsWithFormattedDates = data.map(contact => ({
                    ...contact,
                    submissionDate: contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'N/A',
                    submissionTime: contact.createdAt ? new Date(contact.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                    }) : 'N/A'
                }));

                setContacts(contactsWithFormattedDates);
            } catch (err) {
                console.error('Fetch Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    if (loading) {
        return (
            <div className="content-section">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading contact data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="content-section">
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3 className="error-title">Error Loading Contacts</h3>
                    <p className="error-text">{error}</p>
                    <p className="error-subtext">Please ensure you are logged in and have the necessary permissions.</p>
                </div>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="content-section">
                <div className="no-data-container">
                    <div className="no-data-icon">📧</div>
                    <h3 className="no-data-title">No Contact Submissions</h3>
                    <p className="no-data-text">No contact submissions found in the system.</p>
                    <p className="no-data-subtext">Users can submit contacts through your contact form.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="content-section">
            <div className="section-header">
                <h1 className="section-title">Contact Management</h1>
                <div className="section-stats">
                    <div className="stats-item">
                        <span className="stats-number">{contacts.length}</span>
                        <span className="stats-label">Total Submissions</span>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Country</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Submission Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map((contact, index) => (
                            <tr key={contact._id || index} className="table-row">
                                <td data-label="#">
                                    <span className="id-badge">{index + 1}</span>
                                </td>
                                <td data-label="Name">
                                    <div className="name-container">
                                        <span className="name-text">
                                            {contact.firstName || 'N/A'} {contact.lastName || ''}
                                        </span>
                                    </div>
                                </td>
                                <td data-label="Email">
                                    <a href={`mailto:${contact.email}`} className="email-link">
                                        {contact.email || 'N/A'}
                                    </a>
                                </td>
                                <td data-label="Phone">
                                    <span className="phone-text">{contact.phone || 'N/A'}</span>
                                </td>
                                <td data-label="Country">
                                    <span className="country-text">{contact.country || 'N/A'}</span>
                                </td>
                                <td data-label="Subject">
                                    <span className="subject-text">{contact.subject || 'N/A'}</span>
                                </td>
                                <td data-label="Message">
                                    <div className="message-container">
                                        <span className="message-text">
                                            {contact.message ?
                                                (contact.message.length > 100
                                                    ? contact.message.substring(0, 100) + '...'
                                                    : contact.message
                                                )
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                </td>
                                <td data-label="Submission Date">
                                    <div className="date-container">
                                        <div className="date-main">{contact.submissionDate}</div>
                                        <div className="date-sub">{contact.submissionTime}</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Dashboard Component (no changes needed)
const Dashboard = () => {
    return (
        <div className="content-section">
            <div className="dashboard-container">
                <h1 className="section-title">Dashboard</h1>
                <div className="dashboard-cards">

                    <div className="dashboard-card">
                        <div className="card-icon">📧</div>
                        <div className="card-content">
                            <h3 className="card-title">Dashboard Management</h3>
                            <p className="card-description">View and manage contact submissions</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">👥</div>
                        <div className="card-content">
                            <h3 className="card-title">User Management</h3>
                            <p className="card-description">View and manage registered users</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📧</div>
                        <div className="card-content">
                            <h3 className="card-title">Contact Management</h3>
                            <p className="card-description">View and manage contact submissions</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📧</div>
                        <div className="card-content">
                            <h3 className="card-title">Product Management</h3>
                            <p className="card-description">View and manage contact submissions</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📧</div>
                        <div className="card-content">
                            <h3 className="card-title">Orders Management</h3>
                            <p className="card-description">View and manage contact submissions</p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📧</div>
                        <div className="card-content">
                            <h3 className="card-title">Contact Management</h3>
                            <p className="card-description">View and manage contact submissions</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};


// Login Form Component
const LoginForm = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:9000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed. Please check your credentials.');
            }

            // Login successful
            onLogin();

        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Admin-login-container">
            <div className="login-card">
                <h2 className="login-title">Admin Login</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Main Admin Panel Component
const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:9000/api/admin/check-auth', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    const handleNavClick = (view) => {
        setActiveView(view);
        setIsSidebarOpen(false);
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:9000/api/admin/logout', {
                method: 'POST',
                credentials: 'include',
            });
            setIsAuthenticated(false);
            setActiveView('dashboard');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (!isAuthenticated) {
        return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
    }

    const renderContent = () => {
        switch (activeView) {
            case 'users':
                return <UserData />;
            case 'contacts':
                return <ContactData />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <span className="logo-star">★</span>
                        </div>
                        <span className="logo-text">Admin Panel</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li>
                            <button
                                className={`nav-button ${activeView === 'dashboard' ? 'active' : ''}`}
                                onClick={() => handleNavClick('dashboard')}
                            >
                                <span className="nav-text">Dashboard</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeView === 'users' ? 'active' : ''}`}
                                onClick={() => handleNavClick('users')}
                            >
                                <span className="nav-text">Users</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeView === 'contacts' ? 'active' : ''}`}
                                onClick={() => handleNavClick('contacts')}
                            >
                                <span className="nav-text">Contacts</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeView === 'contacts' ? 'active' : ''}`}
                                onClick={() => handleNavClick('contacts')}
                            >
                                <span className="nav-text">Product</span>
                            </button>
                        </li>
                        <li>
                            <button
                                className={`nav-button ${activeView === 'contacts' ? 'active' : ''}`}
                                onClick={() => handleNavClick('contacts')}
                            >
                                <span className="nav-text">Orders</span>
                            </button>
                        </li>

                        <button onClick={handleLogout} className="logout-button">
                            <span className="logout-text">Logout</span>
                        </button>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-area">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Admin;