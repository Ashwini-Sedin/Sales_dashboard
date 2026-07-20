import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance, { setAccessToken as setApiAccessToken, getAccessToken } from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const logout = useCallback(async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (error) {
            console.warn('Logout request failed (may be expected):', error.message);
        } finally {
            setUser(null);
            setApiAccessToken(null);
            setError(null);
        }
    }, []);

    const refreshToken = useCallback(async () => {
        try {
            // Only attempt refresh if we can make the request
            const response = await axiosInstance.post('/api/auth/refresh');
            const { access_token } = response.data;
            setApiAccessToken(access_token);
            
            // Try to get user info
            try {
                const userResponse = await axiosInstance.get('/api/auth/me');
                setUser(userResponse.data);
                setError(null);
            } catch (meError) {
                console.error('Failed to fetch user info:', meError.message);
                setUser(null);
            }
            return access_token;
        } catch (error) {
            // Refresh failed - likely no valid refresh token
            console.debug('Token refresh failed:', error.message);
            setUser(null);
            setApiAccessToken(null);
            setError(error.message);
            return null;
        }
    }, []);

    const login = async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axiosInstance.post('/api/auth/login', formData);
            const { access_token } = response.data;
            setApiAccessToken(access_token);
            
            const userResponse = await axiosInstance.get('/api/auth/me');
            setUser(userResponse.data);
            setError(null);
        } catch (error) {
            setError(error.response?.data?.detail || error.message);
            throw error;
        }
    };

    // Initialize authentication on app load
    useEffect(() => {
        const initAuth = async () => {
            // Check if we already have an access token in memory
            if (getAccessToken()) {
                try {
                    const userResponse = await axiosInstance.get('/api/auth/me');
                    setUser(userResponse.data);
                    setError(null);
                } catch (error) {
                    console.debug('Failed to fetch user info, attempting token refresh:', error.message);
                    // Try to refresh if fetching user failed
                    await refreshToken();
                }
            } else {
                // No token in memory, try to refresh from cookies
                await refreshToken();
            }
            setLoading(false);
        };
        initAuth();
    }, [refreshToken]);

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
