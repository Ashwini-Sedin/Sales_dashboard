import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { FiUsers, FiDollarSign, FiClock, FiFileText } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
        <div className={`p-4 rounded-lg ${color} mr-4 text-white`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        pipelineValue: '$0',
        docsAwaiting: 0,
        avgTurnaround: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axiosInstance.get('/api/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
                // Fallback mock data for demonstration
                setStats({
                    totalLeads: 1240,
                    pipelineValue: '$4.2M',
                    docsAwaiting: 12,
                    avgTurnaround: 4.5
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64 animate-pulse text-gray-400">Loading Dashboard Stats...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
                <p className="text-gray-500">Real-time performance metrics for DealFlow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Leads" 
                    value={stats.totalLeads} 
                    icon={FiUsers} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Active Pipeline" 
                    value={stats.pipelineValue} 
                    icon={FiDollarSign} 
                    color="bg-cyan-500" 
                />
                <StatCard 
                    title="Docs Pending" 
                    value={stats.docsAwaiting} 
                    icon={FiFileText} 
                    color="bg-orange-500" 
                />
                <StatCard 
                    title="Avg Turnaround" 
                    value={`${stats.avgTurnaround}d`} 
                    icon={FiClock} 
                    color="bg-purple-500" 
                />
            </div>

            {/* Placeholder for charts or recent activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                    Lead Growth Chart Placeholder
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex items-center justify-center text-gray-400">
                    Recent Activity Feed Placeholder
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
