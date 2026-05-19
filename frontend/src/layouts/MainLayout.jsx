import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const nextVal = !prev;
            localStorage.setItem('sidebar-collapsed', String(nextVal));
            return nextVal;
        });
    };

    const toggleSidebarOrCollapse = () => {
        if (window.innerWidth >= 1024) {
            toggleCollapse();
        } else {
            toggleSidebar();
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-df-bg transition-colors relative">
            {/* Sidebar for desktop and mobile */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
                isCollapsed={isCollapsed} 
                toggleCollapse={toggleCollapse} 
            />

            {/* Main Content Wrapper */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header toggleSidebar={toggleSidebarOrCollapse} />

                {/* Main Content Area */}
                <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}
        </div>
    );
};

export default MainLayout;
