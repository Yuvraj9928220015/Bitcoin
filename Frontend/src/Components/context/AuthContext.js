// src/Components/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
        }
    }, []);

    const register = async (name, email, password, phone) => {
        setAuthError(null); 
        try {
            const response = await fetch('http://localhost:9000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, phone }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.msg || 'Registration failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);
            setIsAuthenticated(true);
            return true; 
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Login function
    const login = async (email, password) => {
        setAuthError(null);
        try {
            const response = await fetch('http://localhost:9000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.msg || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            setToken(data.token);
            setIsAuthenticated(true);
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
    };

    const value = {
        token,
        isAuthenticated,
        authError,
        register,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};