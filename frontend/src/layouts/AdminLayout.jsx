import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
    UsersIcon, 
    QueueListIcon, 
    EnvelopeIcon, 
    ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import { FiLayout } from 'react-icons/fi';

const AdminLayout = () => {
    const navItems = [
        { name: 'Users', path: '/admin/users', icon: UsersIcon },
        { name: 'Divisions', path: '/admin/divisions', icon: QueueListIcon },
        { name: 'Notification Templates', path: '/admin/notification-templates', icon: EnvelopeIcon },
        { name: 'Document Templates', path: '/admin/templates', icon: FiLayout },
        { name: 'Audit Logs', path: '/admin/audit-logs', icon: ClipboardDocumentListIcon },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Secondary Admin Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Admin Control
                        </h2>
                    </div>
                    <nav className="p-2 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                    ${isActive 
                                        ? 'bg-indigo-50 text-indigo-700' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Admin Content */}
            <div className="flex-1 min-w-0">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
