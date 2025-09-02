import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductList from '../ProductList/ProductList'; // Import ProductList
import './Admin.css';

const API_URL = 'http://localhost:9000'; // Ensure this matches your backend API URL

export default function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/auth/verify`, {
                withCredentials: true // Important for sending cookies
            });
            if (response.data.authenticated) {
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.log("Not authenticated or error verifying auth for Admin:", error);
            setIsAuthenticated(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError('');

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, loginData, {
                withCredentials: true // Important for receiving cookies
            });

            if (response.data.success) {
                setIsAuthenticated(true);
                setLoginData({ email: '', password: '' });
            } else {
                setLoginError(response.data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            setLoginError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, {
                withCredentials: true
            });
            setIsAuthenticated(false);
        } catch (error) {
            console.error("Logout error in Admin:", error);
        }
    };

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container"> {/* Renamed class for admin specific styling */}
                <div className="login-card">
                    <div className="login-header">
                        <h1>Admin Panel Login</h1>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        {loginError && (
                            <div className="login-error">
                                {loginError}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            className={`login-btn ${isLoggingIn ? 'loading' : ''}`}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // If authenticated, render the ProductList and a logout button
    return (
        <div className="admin-dashboard">
            <header className="admin-dashboard-header">
                <h2>Welcome to the Admin Dashboard</h2>
                <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
            </header>
            <ProductList onUnauthorized={() => setIsAuthenticated(false)} /> {/* Pass a callback for unauthorized access */}
        </div>
    );
}