import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    FiGrid, 
    FiUsers, 
    FiFileText, 
    FiBarChart2, 
    FiMessageSquare, 
    FiSettings, 
    FiShield 
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: FiGrid, path: '/dashboard' },
        { name: 'Leads', icon: FiUsers, path: '/leads' },
        { name: 'Documents', icon: FiFileText, path: '/documents' },
        { name: 'Reports', icon: FiBarChart2, path: '/reports' },
        { name: 'Communication', icon: FiMessageSquare, path: '/communication' },
    ];

    const adminItems = [
        { name: 'Admin', icon: FiShield, path: '/admin', roles: ['super_admin', 'division_head'] },
        { name: 'Settings', icon: FiSettings, path: '/settings' },
    ];

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0D1B2A] text-white transform transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:static lg:inset-0`}
        >
            <div className="flex items-center justify-between h-16 px-6 bg-[#1B263B]">
                <span className="text-xl font-bold tracking-wider text-cyan-400">DEALFLOW</span>
                <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
                    <FiGrid size={24} />
                </button>
            </div>

            <nav className="mt-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => 
                            `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group ${
                                isActive 
                                ? 'bg-[#415A77] text-white border-l-4 border-[#00C6D7]' 
                                : 'text-gray-400 hover:bg-[#1B263B] hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                    </NavLink>
                ))}

                <div className="pt-4 mt-4 border-t border-gray-700">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Management
                    </p>
                    {adminItems.filter(item => !item.roles || item.roles.includes(user?.role)).map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => 
                                `flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md transition-all duration-200 group ${
                                    isActive 
                                    ? 'bg-[#415A77] text-white border-l-4 border-[#00C6D7]' 
                                    : 'text-gray-400 hover:bg-[#1B263B] hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
