import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiUserPlus, FiActivity, FiFile, FiCheckCircle, FiUser, FiX, FiClipboard, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const fetchNotifications = async () => {
  const res = await api.get('/api/notifications', { params: { limit: 50 } });
  return res.data || res;
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const notificationCount = notifications.length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await api.put(`/api/notifications/${notification.id}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const deleteNotification = async (event, notificationId) => {
    event.stopPropagation();
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const clearAll = async () => {
    try {
      await api.delete('/api/notifications/clear-all');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_lead': return <FiUserPlus className="text-blue-500" />;
      case 'stage_changed': return <FiActivity className="text-amber-500" />;
      case 'doc_generated': return <FiFile className="text-purple-500" />;
      case 'doc_signed': return <FiCheckCircle className="text-green-500" />;
      case 'lead_assigned': return <FiUser className="text-cyan-500" />;
      case 'task_assigned': return <FiClipboard className="text-orange-500" />;
      case 'note_added': return <FiMessageSquare className="text-teal-500" />;
      case 'lead_deleted': return <FiTrash2 className="text-red-500" />;
      case 'team_assigned': return <FiUser className="text-cyan-500" />;
      case 'lead_updated': return <FiActivity className="text-indigo-500" />;
      default: return <FiBell className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    await markRead(notification);
    if (notification.lead_id) {
      navigate(`/leads/${notification.lead_id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-300 dark:hover:text-indigo-300 dark:hover:bg-gray-800 rounded-full transition-colors relative"
        aria-label="Open notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-[420px]">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{notificationCount} total</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FiBell size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">You're all caught up!</p>
                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">New deal activity will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group p-3 border-b border-gray-50 dark:border-gray-800 flex items-start gap-3 transition-colors ${
                      notification.lead_id ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                    } ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500' : 'bg-white dark:bg-gray-900 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.message.length > 80 
                          ? notification.message.substring(0, 80) + '...' 
                          : notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(event) => deleteNotification(event, notification.id)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete notification"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
              <button
                onClick={clearAll}
                className="text-xs text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 font-medium"
              >
                Clear all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
