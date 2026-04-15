import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Verify token and restore session on mount
    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('codec_token');
            const storedUser = localStorage.getItem('codec_user');

            if (!token || !storedUser) {
                setIsLoading(false);
                return;
            }

            try {
                // Verify token with backend
                const { data } = await apiClient.get('/api/auth/me');
                setUser(data.user);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Token verification failed:', error);
                // Token is invalid, clear storage
                localStorage.removeItem('codec_token');
                localStorage.removeItem('codec_user');
                localStorage.removeItem('codec_user_id');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('codec_token', token);
        localStorage.setItem('codec_user', JSON.stringify(userData));
        localStorage.setItem('codec_user_id', userData._id);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('codec_token');
        localStorage.removeItem('codec_user');
        localStorage.removeItem('codec_user_id');
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
