import React from 'react';
import { FiBell, FiMoon, FiSun, FiLogOut, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './layout/NotificationBell';

const Header = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = React.useState(false);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'division_head': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'sales_manager': return 'bg-green-100 text-green-800 border-green-200';
            case 'salesperson': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
                >
                    <FiMenu size={24} />
                </button>
                <div className="ml-4 lg:ml-0 flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{user?.first_name} {user?.last_name}</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                            {user?.role?.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{user?.division_name || 'Global'}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                >
                    {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                </button>

                <NotificationBell />

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <button 
                    onClick={logout}
                    className="flex items-center space-x-2 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <FiLogOut size={20} />
                    <span className="text-sm font-medium hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
