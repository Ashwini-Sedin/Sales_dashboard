import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiUserPlus, FiActivity, FiFile, FiCheckCircle, FiUser } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const fetchNotifications = async () => {
  const res = await api.get('/api/notifications');
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

  const getIcon = (type) => {
    switch (type) {
      case 'new_lead': return <FiUserPlus className="text-blue-500" />;
      case 'stage_changed': return <FiActivity className="text-amber-500" />;
      case 'doc_generated': return <FiFile className="text-purple-500" />;
      case 'doc_signed': return <FiCheckCircle className="text-green-500" />;
      case 'lead_assigned': return <FiUser className="text-cyan-500" />;
      default: return <FiBell className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.lead_id) {
      navigate(`/leads/${notification.lead_id}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                <FiBell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 border-b border-gray-50 flex items-start gap-3 transition-colors ${
                      notification.lead_id ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-white border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.is_read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {notification.message.length > 80 
                          ? notification.message.substring(0, 80) + '...' 
                          : notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
