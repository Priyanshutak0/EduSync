import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const token = authService.getToken();
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            console.log('AuthContext: Attempting login with:', { email, passwordLength: password?.length });
            const token = await authService.login(email, password);
            const userData = JSON.parse(localStorage.getItem('user'));
            setUser(userData);
            setIsAuthenticated(true);
            return token;
        } catch (error) {
            console.error('AuthContext: Login error:', error);
            throw error;
        }
    };

    const register = async (name, email, password, role) => {
        try {
            await authService.register(name, email, password, role);
            // After registration, automatically log in the user
            return await login(email, password);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 