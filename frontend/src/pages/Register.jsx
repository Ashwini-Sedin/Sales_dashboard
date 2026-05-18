import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Register = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState(null);
    const password = watch('password');

    const onSubmit = async (data) => {
        setLoading(true);
        setApiError(null);
        try {
            await axiosInstance.post('/api/auth/register', {
                email: data.email,
                password: data.password,
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                role: 'Operations Analyst',
            });
            navigate('/login');
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // Pydantic validation errors: [{msg, loc, ...}, ...]
                setApiError(detail.map(e => e.msg).join(', '));
            } else if (typeof detail === 'string') {
                setApiError(detail);
            } else {
                setApiError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Back to sign in */}
                <Link to="/login" style={styles.backLink}>
                    <span style={styles.backArrow}>&#8592;</span> Back to sign in
                </Link>

                <h1 style={styles.title}>Create your account</h1>

                <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                    {/* Email */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Email</label>
                        <div style={styles.inputWrapper}>
                            <span style={styles.icon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </span>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
                                })}
                                id="register-email"
                                type="email"
                                placeholder="you@example.com"
                                style={styles.input}
                            />
                        </div>
                        {errors.email && <p style={styles.error}>{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrapper}>
                            <span style={styles.icon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Min. 8 characters' }
                                })}
                                id="register-password"
                                type="password"
                                placeholder="Min. 8 characters"
                                style={styles.input}
                            />
                        </div>
                        {errors.password && <p style={styles.error}>{errors.password.message}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div style={styles.fieldGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={styles.inputWrapper}>
                            <span style={styles.icon}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === password || 'Passwords do not match'
                                })}
                                id="register-confirm-password"
                                type="password"
                                placeholder="Re-enter password"
                                style={styles.input}
                            />
                        </div>
                        {errors.confirmPassword && <p style={styles.error}>{errors.confirmPassword.message}</p>}
                    </div>

                    {apiError && <p style={styles.apiError}>{apiError}</p>}

                    <button
                        id="register-submit"
                        type="submit"
                        disabled={loading}
                        style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef1f6',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
    },
    card: {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '40px 40px 44px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        color: '#5a6a85',
        textDecoration: 'none',
        fontSize: '14px',
        marginBottom: '24px',
        fontWeight: '500',
    },
    backArrow: {
        fontSize: '16px',
    },
    title: {
        fontSize: '26px',
        fontWeight: '800',
        color: '#1a2235',
        textAlign: 'center',
        margin: '0 0 28px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a2235',
        textAlign: 'center',
    },
    inputWrapper: {
        display: 'flex',
        alignItems: 'center',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        padding: '0 14px',
        background: '#f8fafc',
        gap: '10px',
    },
    icon: {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
    },
    input: {
        flex: 1,
        border: 'none',
        background: 'transparent',
        padding: '13px 0',
        fontSize: '15px',
        color: '#1a2235',
        outline: 'none',
    },
    button: {
        width: '100%',
        padding: '15px',
        background: '#1a2235',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        marginTop: '4px',
        transition: 'background 0.2s',
    },
    error: {
        color: '#ef4444',
        fontSize: '12px',
        margin: '2px 0 0',
    },
    apiError: {
        color: '#ef4444',
        fontSize: '13px',
        textAlign: 'center',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '10px',
    },
};

export default Register;
