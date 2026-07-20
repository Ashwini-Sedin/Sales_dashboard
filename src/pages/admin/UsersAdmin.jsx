import React, { useState, useEffect } from 'react';
import api from '../../api';
import { PlusIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';

const UsersAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to completely delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
            try {
                await api.delete(`/api/users/${user.id}`);
                fetchUsers(); // Refresh the list
            } catch (error) {
                console.error('Error deleting user:', error);
                alert(error.response?.data?.detail || 'Failed to delete user');
            }
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    // Use a hash function to pick consistent colors for users
    const getAvatarColor = (firstName) => {
        const colors = [
            'bg-[#0ebf99]', 'bg-purple-500', 'bg-blue-500', 'bg-rose-500', 
            'bg-amber-500', 'bg-teal-500', 'bg-indigo-500'
        ];
        const charCode = (firstName || 'A').charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const getRoleBadge = (role) => {
        // Map realistic roles to colors matching the aesthetic
        const styles = {
            'Chief Executive Officer': 'bg-[#e5faef] dark:bg-[#10151b] text-[#0ebf99] border-[#0ebf99]/30',
            'Division Head': 'bg-blue-50 dark:bg-[#10151b] text-blue-500 border-blue-500/30',
            'Sales Manager': 'bg-purple-50 dark:bg-[#10151b] text-purple-500 border-purple-500/30',
            'Business Development Executive': 'bg-amber-50 dark:bg-[#10151b] text-amber-600 border-amber-500/30',
        };
        // Default style if role doesn't match predefined ones
        const defaultStyle = 'bg-gray-50 dark:bg-[#10151b] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[role] || defaultStyle}`}>
                {role}
            </span>
        );
    };

    const formatLastActive = (dateString) => {
        if (!dateString) return 'Never';
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true })
                .replace('about ', '')
                .replace(' hours', ' hrs')
                .replace(' minutes', ' min');
        } catch {
            return 'Unknown';
        }
    };

    const filteredUsers = users.filter(u => 
        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-xl bg-white dark:bg-[#141a21] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ebf99] w-full sm:w-64"
                    />
                    <select className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-xl bg-white dark:bg-[#141a21] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ebf99]">
                        <option>All Roles</option>
                        <option>Chief Executive Officer</option>
                        <option>Division Head</option>
                        <option>Business Development Executive</option>
                        <option>Sales Manager</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-[#0ebf99] text-white rounded-xl hover:bg-opacity-90 transition-colors shadow-sm text-sm font-bold gap-2 whitespace-nowrap"
                >
                    <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
                    Invite User
                </button>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-[#141a21] rounded-2xl border border-gray-100 dark:border-df-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-gray-100 dark:border-df-border">
                            <tr>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">User</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Role</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Division</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Leads</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Active</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-df-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-400 dark:text-gray-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-[#10151b] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-9 h-9 rounded-full ${getAvatarColor(user.first_name)} flex items-center justify-center text-white font-bold text-xs mr-4 shrink-0 shadow-sm`}>
                                                    {getInitials(user.first_name, user.last_name)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                                    {user.first_name} {user.last_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                                            {user.division_name || 'All'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {user.lead_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-[#0ebf99]">
                                            {formatLastActive(user.updated_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-bold ${user.is_active ? 'text-[#0ebf99]' : 'text-gray-400'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 space-x-3">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="text-sm font-bold text-[#0ebf99] hover:text-[#0b9c7d] transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user)}
                                                className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateUserModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onSuccess={fetchUsers}
                />
            )}

            {isEditModalOpen && (
                <EditUserModal 
                    isOpen={isEditModalOpen} 
                    user={selectedUser}
                    onClose={() => setIsEditModalOpen(false)} 
                    onSuccess={fetchUsers}
                />
            )}
        </div>
    );
};

export default UsersAdmin;
