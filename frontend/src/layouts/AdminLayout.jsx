import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout = () => {
    
    // The screenshot shows "Admin — Users & Divisions" as the title
    // If we're on a different sub-page, we could change the title, but for now let's keep it simple
    
    return (
        <div className="p-2 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Admin — Users & Divisions
            </h1>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-df-border mb-8 gap-8">
                <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `
                        pb-3 px-1 text-sm font-bold transition-colors relative
                        ${isActive 
                            ? 'text-[#0ebf99]' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                    `}
                >
                    {({ isActive }) => (
                        <>
                            Users & Roles
                            {isActive && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0ebf99] rounded-t-full" />
                            )}
                        </>
                    )}
                </NavLink>
                <NavLink
                    to="/admin/divisions"
                    className={({ isActive }) => `
                        pb-3 px-1 text-sm font-bold transition-colors relative
                        ${isActive 
                            ? 'text-[#0ebf99]' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                    `}
                >
                    {({ isActive }) => (
                        <>
                            Divisions
                            {isActive && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0ebf99] rounded-t-full" />
                            )}
                        </>
                    )}
                </NavLink>
                {/* We can add other admin tabs here if needed in the future */}
            </div>

            {/* Admin Content */}
            <div className="min-w-0">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
