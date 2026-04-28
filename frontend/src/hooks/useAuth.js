import { useState, useCallback } from 'react';
import axiosInstance, { setAccessToken } from '../api/axios';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await axiosInstance.post('/api/auth/login', formData);
            const { access_token } = response.data;
            setAccessToken(access_token);
            
            // Get user info
            const userResponse = await axiosInstance.get('/api/auth/me');
            setUser(userResponse.data);
            return userResponse.data;
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await axiosInstance.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    }, []);

    const checkAuth = useCallback(async () => {
        setLoading(true);
        try {
            // Try to refresh token first to see if session is valid
            const refreshResponse = await axiosInstance.post('/api/auth/refresh');
            setAccessToken(refreshResponse.data.access_token);
            
            const userResponse = await axiosInstance.get('/api/auth/me');
            setUser(userResponse.data);
        } catch (err) {
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { user, loading, error, login, logout, checkAuth };
};
