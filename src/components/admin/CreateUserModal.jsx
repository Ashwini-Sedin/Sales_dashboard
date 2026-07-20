import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Reset success state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSuccessData(null);
            // Reset form if needed, though unmounting usually handles it
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const response = await api.get('/api/divisions');
                setDivisions(response.data);
            } catch (error) {
                console.error('Error fetching divisions:', error);
            }
        };
        fetchDivisions();
    }, []);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            
            // Generate a secure temporary password since it's required by the backend
            const tempPassword = Math.random().toString(36).slice(-8) + 'Df1!';
            const payload = {
                ...data,
                password: tempPassword,
                division_id: data.division_id || null
            };
            
            await api.post('/api/users', payload);
            setSuccessData({ password: tempPassword });
            onSuccess();
            // We do not call onClose() here so the success screen remains visible
        } catch (error) {
            console.error('Error creating user:', error);
            // Use an inline error or keep the alert for actual errors, but let's change alert to simple error
            alert(error.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose} />

                <div className="inline-block align-bottom bg-white dark:bg-[#141a21] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-df-border">
                    <div className="px-6 py-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-df-textlight">Invite New User</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {successData ? (
                            <div className="text-center py-6">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                                    <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation Sent!</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    The user has been created successfully. Please share this temporary password with them so they can log in.
                                </p>
                                
                                <div className="bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-xl p-5 mb-8">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Temporary Password</p>
                                    <p className="text-xl font-mono font-medium text-gray-900 dark:text-white select-all">
                                        {successData.password}
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full px-4 py-3 bg-[#0ebf99] text-white rounded-xl hover:bg-opacity-90 transition-colors font-semibold text-sm shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">First Name</label>
                                        <input
                                            {...register('first_name', { required: 'Required' })}
                                            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border ${errors.first_name ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-df-border focus:ring-[#0ebf99]'} rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-400`}
                                            placeholder="John"
                                        />
                                        {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Last Name</label>
                                        <input
                                            {...register('last_name', { required: 'Required' })}
                                            className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border ${errors.last_name ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-df-border focus:ring-[#0ebf99]'} rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-400`}
                                            placeholder="Doe"
                                        />
                                        {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border ${errors.email ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-df-border focus:ring-[#0ebf99]'} rounded-xl focus:outline-none focus:ring-2 transition-all placeholder-gray-400`}
                                        placeholder="john.doe@company.com"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Role</label>
                                    <select
                                        {...register('role', { required: 'Required' })}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border border-gray-200 dark:border-df-border focus:ring-[#0ebf99] rounded-xl focus:outline-none focus:ring-2 transition-all"
                                    >
                                        <option value="">Select a role...</option>
                                        <option value="salesperson">Salesperson - Manage assigned leads</option>
                                        <option value="division_head">Division Head - Oversee division operations</option>
                                        <option value="admin">Admin - Full system access</option>
                                    </select>
                                    {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Division</label>
                                    <select
                                        {...register('division_id')}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border border-gray-200 dark:border-df-border focus:ring-[#0ebf99] rounded-xl focus:outline-none focus:ring-2 transition-all"
                                    >
                                        <option value="">Select Division (Optional)</option>
                                        {divisions.map(div => (
                                            <option key={div.id} value={div.id}>{div.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#10151b] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors font-semibold text-sm border border-transparent dark:border-df-border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 bg-[#0ebf99] text-white rounded-xl hover:bg-opacity-90 transition-colors font-semibold text-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Sending...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
