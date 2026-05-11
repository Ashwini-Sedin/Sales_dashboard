import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance, { setAccessToken as setApiAccessToken } from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            setApiAccessToken(null);
        }
    }, []);

    const refreshToken = useCallback(async () => {
        try {
            const response = await axiosInstance.post('/api/auth/refresh');
            const { access_token } = response.data;
            setApiAccessToken(access_token);
            
            const userResponse = await axiosInstance.get('/api/auth/me');
            setUser(userResponse.data);
            return access_token;
        } catch (error) {
            logout();
            return null;
        }
    }, [logout]);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await axiosInstance.post('/api/auth/login', formData);
        const { access_token } = response.data;
        setApiAccessToken(access_token);
        
        const userResponse = await axiosInstance.get('/api/auth/me');
        setUser(userResponse.data);
    };

    useEffect(() => {
        const initAuth = async () => {
            await refreshToken();
            setLoading(false);
        };
        initAuth();
    }, [refreshToken]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
