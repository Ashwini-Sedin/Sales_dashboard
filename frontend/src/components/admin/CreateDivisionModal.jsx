import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CreateDivisionModal = ({ isOpen, division, onClose, onSuccess }) => {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const primaryColor = watch('primary_color', '#4f46e5');
    const secondaryColor = watch('secondary_color', '#818cf8');

    useEffect(() => {
        if (division) {
            reset({
                name: division.name,
                head_user_id: division.head_user_id || '',
                primary_color: division.primary_color || '#4f46e5',
                secondary_color: division.secondary_color || '#818cf8',
                logo_url: division.logo_url || ''
            });
        } else {
            reset({
                primary_color: '#4f46e5',
                secondary_color: '#818cf8'
            });
        }
    }, [division, reset]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            if (division) {
                await axios.put(`/api/divisions/${division.id}`, data);
            } else {
                await axios.post('/api/divisions', data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving division:', error);
            alert(error.response?.data?.detail || 'Failed to save division');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-black bg-opacity-40" onClick={onClose} />

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                    <div className="bg-white px-6 py-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{division ? 'Edit Division' : 'Add New Division'}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Division Name</label>
                                <input
                                    {...register('name', { required: 'Required' })}
                                    className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-100 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 transition-all`}
                                    placeholder="e.g. Enterprise Software"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Division Head</label>
                                <select
                                    {...register('head_user_id')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:ring-indigo-500 rounded-xl focus:outline-none focus:ring-2 transition-all"
                                >
                                    <option value="">Select a User...</option>
                                    {users.filter(u => u.role !== 'sales_rep').map(user => (
                                        <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Color</label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            {...register('primary_color')}
                                            className="w-12 h-12 rounded-xl border border-gray-100 p-1 bg-white cursor-pointer"
                                        />
                                        <input
                                            {...register('primary_color')}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Secondary Color</label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="color"
                                            {...register('secondary_color')}
                                            className="w-12 h-12 rounded-xl border border-gray-100 p-1 bg-white cursor-pointer"
                                        />
                                        <input
                                            {...register('secondary_color')}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-mono"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Logo URL</label>
                                <input
                                    {...register('logo_url')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:ring-indigo-500 rounded-xl focus:outline-none focus:ring-2 transition-all"
                                    placeholder="https://example.com/logo.png"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Live Preview</span>
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        P
                                    </div>
                                    <div 
                                        className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: secondaryColor }}
                                    >
                                        S
                                    </div>
                                    <div className="text-sm text-gray-500 italic">Division branding colors</div>
                                </div>
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
                                    {loading ? 'Saving...' : 'Save Division'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDivisionModal;
