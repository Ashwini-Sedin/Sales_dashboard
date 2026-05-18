import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditUserModal = ({ isOpen, user, onClose, onSuccess }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                division_id: user.division_id || ''
            });
        }
    }, [user, reset]);

    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const response = await axios.get('/api/divisions');
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
            await axios.put(`/api/users/${user.id}`, data);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
            alert(error.response?.data?.detail || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-black bg-opacity-40" onClick={onClose} />

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-6 py-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                                    <input
                                        {...register('first_name', { required: 'Required' })}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.first_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                    />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                                    <input
                                        {...register('last_name', { required: 'Required' })}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.last_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                    />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    type="email"
                                    {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                                    className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    {...register('role', { required: 'Required' })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:ring-indigo-500 rounded-xl focus:outline-none focus:ring-2 transition-all"
                                >
                                    <option value="sales_rep">Sales Rep</option>
                                    <option value="division_head">Division Head</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Division</label>
                                <select
                                    {...register('division_id')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:ring-indigo-500 rounded-xl focus:outline-none focus:ring-2 transition-all"
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
                                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 font-semibold text-sm disabled:opacity-50"
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
