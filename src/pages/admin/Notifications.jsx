import React, { useState, useEffect } from 'react';
import api from '../../api';
import { formatDistanceToNow } from 'date-fns';
import { 
    BriefcaseIcon, 
    DocumentCheckIcon, 
    ExclamationTriangleIcon, 
    PhoneIcon, 
    BoltIcon, 
    ChartBarIcon,
    BellIcon,
    CheckIcon
} from '@heroicons/react/24/solid';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const getIconAndColor = (type) => {
        const typeLower = (type || '').toLowerCase();
        if (typeLower.includes('lead')) return { icon: BriefcaseIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
        if (typeLower.includes('document') || typeLower.includes('sign')) return { icon: DocumentCheckIcon, color: 'text-[#0ebf99]', bg: 'bg-[#e5faef] dark:bg-[#0ebf99]/10' };
        if (typeLower.includes('approval') || typeLower.includes('alert')) return { icon: ExclamationTriangleIcon, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
        if (typeLower.includes('call')) return { icon: PhoneIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' };
        if (typeLower.includes('duplicate') || typeLower.includes('error')) return { icon: BoltIcon, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' };
        if (typeLower.includes('stage') || typeLower.includes('update')) return { icon: ChartBarIcon, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' };
        
        return { icon: BellIcon, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="p-2 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-df-border pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h1>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllAsRead}
                        className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#141a21] transition-colors"
                    >
                        Mark All Read
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-[#141a21] border border-gray-100 dark:border-df-border rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-[#10151b] rounded-full flex items-center justify-center mb-4">
                            <BellIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">All caught up!</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">You don't have any notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-df-border">
                        {notifications.map((notification) => {
                            const { icon: Icon, color, bg } = getIconAndColor(notification.type);
                            
                            return (
                                <div 
                                    key={notification.id} 
                                    className={`relative p-5 sm:p-6 flex items-start gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-[#10151b]/50 group ${!notification.is_read ? 'bg-white dark:bg-[#141a21]' : 'bg-gray-50 dark:bg-[#10151b]'}`}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    {/* Unread indicator line */}
                                    {!notification.is_read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0ebf99]" />
                                    )}

                                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${bg}`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 mb-1">
                                            <h4 className={`text-sm ${!notification.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
                                                {notification.type}
                                            </h4>
                                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${!notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                            {notification.message}
                                        </p>
                                    </div>

                                    {!notification.is_read && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-[#0ebf99] hover:bg-[#e5faef] dark:hover:bg-[#0ebf99]/10 rounded-lg transition-all shrink-0"
                                            title="Mark as read"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
