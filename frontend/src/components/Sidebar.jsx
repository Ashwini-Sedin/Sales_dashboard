import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FiGrid, 
    FiUser,
    FiList,
    FiColumns,
    FiMail,
    FiFileText,
    FiFilePlus,
    FiEdit3,
    FiBarChart2,
    FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await api.get('/api/notifications');
                const count = response.data.filter(n => !n.is_read).length;
                setUnreadCount(count);
            } catch (error) {
                console.error('Error fetching unread notifications:', error);
            }
        };
        
        fetchUnreadCount();
        
        // Poll every 15 seconds to keep it updated
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
    }, []);

    const menuGroups = [
        {
            title: 'LEAD DETAIL',
            items: [
                { name: '360° Lead View', icon: FiUser, path: '/leads' }
            ]
        },
        {
            title: 'MAIN',
            items: [
                { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
                { name: 'Leads', icon: FiList, path: '/leads' },
                { name: 'Pipeline', icon: FiColumns, path: '/pipeline' }
            ]
        },
        {
            title: 'LEAD DETAIL',
            items: [
                { name: 'Emails & Calls', icon: FiMail, path: '/emails' }
            ]
        },
        {
            title: 'DOCUMENTS',
            items: [
                { name: 'All Documents', icon: FiFileText, path: '/documents' },
                { name: 'Generate Doc', icon: FiFilePlus, path: '/generate-doc' },
                { name: 'E-Signature', icon: FiEdit3, path: '/e-signature' }
            ]
        },
        {
            title: 'ANALYTICS',
            items: [
                { name: 'Reports', icon: FiBarChart2, path: '/reports' }
            ]
        },
        {
            title: 'ADMIN',
            roles: ['admin', 'division_head', 'Chief Executive Officer', 'Division Head'],
            items: [
                { name: 'Users & Divisions', icon: FiSettings, path: '/admin' },
                { name: 'Notifications', icon: FiMail, path: '/admin/notifications', badge: unreadCount }
            ]
        }
    ];

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-df-sidebar text-gray-800 dark:text-white transform transition-all duration-300 ease-in-out overflow-y-auto scrollbar-hide lg:relative ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 ${
                isCollapsed ? 'lg:w-0 overflow-hidden border-r-0' : 'lg:w-64 border-r border-gray-200 dark:border-df-border'
            }`}
        >
            <div className={`flex items-center justify-between h-20 px-6 border-b border-gray-200 dark:border-df-border ${isCollapsed ? 'opacity-0' : ''}`}>
                {isCollapsed ? (
                    <span className="text-2xl font-black tracking-wider text-[#0ebf99] dark:text-df-accent">
                        DF
                    </span>
                ) : (
                    <div className="flex flex-col">
                        <span className="text-[22px] font-bold tracking-wide text-[#0ebf99] dark:text-df-accent">
                            DealFlow
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-df-text mt-1">
                            CLOUD DIVISION
                        </span>
                    </div>
                )}
                {!isCollapsed && (
                    <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <FiGrid size={24} />
                    </button>
                )}
            </div>

            <nav className="mt-6 pb-20">
                {menuGroups.map((group, index) => {
                    if (group.roles && !group.roles.includes(user?.role)) return null;

                    return (
                        <div key={index} className="mb-6">
                            {isCollapsed ? (
                                <div className="mx-4 border-t border-gray-100 dark:border-df-border my-3" />
                            ) : (
                                <p className="px-6 text-xs font-semibold text-gray-500 dark:text-df-text uppercase tracking-widest mb-3">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.name}
                                        to={item.path}
                                        end={item.name === 'Leads'}
                                        title={isCollapsed ? item.name : undefined}
                                        className={({ isActive }) => {
                                            const is360Active = item.name === '360° Lead View' && window.location.pathname.startsWith('/leads/');
                                            const isLeadsActive = item.name === 'Leads' && window.location.pathname === '/leads';
                                            const active = (item.name === '360° Lead View' || item.name === 'Leads') ? (is360Active || isLeadsActive) : isActive;
                                            
                                            // Ensure only ONE of them is active based on the specific condition
                                            const finalActive = (item.name === '360° Lead View') ? is360Active : (item.name === 'Leads' ? isLeadsActive : isActive);

                                            return `flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'px-6 py-2.5'} text-sm font-medium transition-all duration-200 group ${
                                                finalActive
                                                ? 'bg-[#e5faef] dark:bg-df-cardhover text-[#0ebf99] dark:text-df-accent border-y border-r border-[#0ebf99]/30 border-l-2 border-l-[#0ebf99] dark:border-transparent dark:border-l-df-accent' 
                                                : 'text-[#64748b] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-df-card hover:text-gray-900 dark:hover:text-white border border-transparent border-l-2'
                                            }`;
                                        }}
                                    >
                                        <item.icon className={`${isCollapsed ? 'm-0' : 'mr-4'} h-5 w-5`} />
                                        {!isCollapsed && <span className="flex-1">{item.name}</span>}
                                        {!isCollapsed && item.badge && (
                                            <span className="bg-[#0ebf99] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
