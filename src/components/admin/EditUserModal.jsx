import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditUserModal = ({ isOpen, onClose, onSuccess, user }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);

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

    useEffect(() => {
        if (user) {
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                division_id: user.division_id || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            await api.put(`/api/users/${user.id}`, data);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            const detail = error.response?.data?.detail;
            const errMsg = Array.isArray(detail) ? detail.map(e => `${e.loc?.slice(-1)}: ${e.msg}`).join('\n') : (detail || 'Failed to update user');
            alert(`Failed to update user:\n${errMsg}`);
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
                            <h3 className="text-xl font-bold text-gray-900 dark:text-df-textlight">Edit User Details</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">First Name</label>
                                    <input
                                        {...register('first_name', { required: 'Required' })}
                                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border ${errors.first_name ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-df-border focus:ring-[#0ebf99]'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                        placeholder="John"
                                    />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Last Name</label>
                                    <input
                                        {...register('last_name', { required: 'Required' })}
                                        className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-[#10151b] text-gray-900 dark:text-white border ${errors.last_name ? 'border-red-300 dark:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-df-border focus:ring-[#0ebf99]'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                        placeholder="Doe"
                                    />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-[#1a222c] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-df-border rounded-xl cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-df-text">Email address cannot be changed.</p>
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
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;
