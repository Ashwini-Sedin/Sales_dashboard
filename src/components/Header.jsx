import React from 'react';
import { FiMoon, FiSun, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './layout/NotificationBell';

const Header = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            case 'division_head': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'sales_manager': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'salesperson': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
        }
    };

    return (
        <header className="h-16 bg-white dark:bg-df-bg border-b border-gray-200 dark:border-df-border flex items-center justify-between px-4 lg:px-8 transition-colors">
            <div className="flex items-center">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-df-card mr-2"
                >
                    <FiMenu size={24} />
                </button>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                            {user?.role?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user?.division_name || 'Global'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 hover:text-df-accent dark:text-gray-400 dark:hover:text-df-accent hover:bg-indigo-50 dark:hover:bg-df-card rounded-full transition-colors"
                >
                    {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
                </button>

                <NotificationBell />

                <div className="h-8 w-px bg-gray-200 dark:bg-df-border mx-2"></div>

                <button 
                    onClick={logout}
                    className="flex items-center space-x-2 p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                    <FiLogOut size={20} />
                    <span className="text-sm font-medium hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
