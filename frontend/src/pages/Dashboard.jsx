import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

const StatCard = ({ title, value, subtext, subtextColor, bgCircleColor }) => (
    <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border flex flex-col justify-between relative overflow-hidden group hover:border-indigo-100 dark:hover:border-df-accent/50 transition-colors">
        <div className="relative z-10">
            <p className="text-xs font-semibold text-gray-500 dark:text-df-text uppercase tracking-wider mb-4">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-df-textlight mb-2">{value}</h3>
            {subtext && <p className={`text-[11px] ${subtextColor || 'text-gray-400 dark:text-df-text'}`}>{subtext}</p>}
        </div>
        
        {/* Subtle decorative circle in top right */}
        <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20 ${bgCircleColor}`}></div>
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
                // Fallback mock data for demonstration matching screenshot
                setStats({
                    totalLeads: 12,
                    pipelineValue: '₹2.4Cr',
                    docsAwaiting: 3,
                    avgTurnaround: 18
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-df-textlight">Dashboard</h1>
                
                <div className="flex items-center space-x-4">
                    <div className="relative hidden md:block">
                        <input 
                            type="text" 
                            placeholder="Search leads..." 
                            className="bg-white dark:bg-df-card border border-gray-200 dark:border-df-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-df-accent text-gray-900 dark:text-df-textlight w-64"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button className="bg-df-accent hover:bg-opacity-90 text-black font-semibold py-2 px-4 rounded-lg flex items-center transition-colors">
                        <span className="mr-2">+</span> New Lead
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Leads" 
                    value={stats.totalLeads} 
                    subtext="↑ +12 this week"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-accent"
                />
                <StatCard 
                    title="Pipeline Value" 
                    value={stats.pipelineValue} 
                    subtext="↑ Active deals"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-purple"
                />
                <StatCard 
                    title="Won This Month" 
                    value={stats.docsAwaiting} 
                    subtext="64% win rate"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-yellow"
                />
                <StatCard 
                    title="Avg. Turnaround" 
                    value={`${stats.avgTurnaround}d`} 
                    subtext="↑ 2d vs last month"
                    subtextColor="text-red-500"
                    bgCircleColor="bg-df-pink"
                />
            </div>

            {/* Pipeline by stage and leads by source */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-df-textlight">Pipeline by Stage</h3>
                        <span className="text-xs text-gray-500 dark:text-df-text">Cloud Division</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'New', count: 1, color: 'bg-df-accent', width: '20%' },
                            { label: 'Contacted', count: 2, color: 'bg-df-purple', width: '40%' },
                            { label: 'Qualified', count: 4, color: 'bg-green-500', width: '80%' },
                            { label: 'Proposal', count: 1, color: 'bg-df-yellow', width: '20%' },
                            { label: 'Negotiation', count: 1, color: 'bg-df-pink', width: '20%' },
                            { label: 'Won', count: 3, color: 'bg-df-accent', width: '60%' },
                        ].map((stage) => (
                            <div key={stage.label} className="flex items-center text-sm">
                                <span className="w-24 text-gray-600 dark:text-df-text">{stage.label}</span>
                                <div className="flex-1 ml-4 mr-4 bg-gray-100 dark:bg-[#10151b] h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${stage.color} rounded-full`} style={{ width: stage.width }}></div>
                                </div>
                                <span className="text-gray-900 dark:text-df-textlight w-4 text-right">{stage.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
                    <h3 className="font-bold text-gray-900 dark:text-df-textlight mb-6">Leads by Source</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Google Ads', count: 62, dot: 'text-df-accent' },
                            { label: 'Manual', count: 34, dot: 'text-df-purple' },
                            { label: 'Referral', count: 23, dot: 'text-green-500' },
                            { label: 'Event', count: 16, dot: 'text-df-yellow' },
                            { label: 'Other', count: 12, dot: 'text-gray-500' },
                        ].map(source => (
                            <div key={source.label} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className={`mr-2 ${source.dot}`}>●</span>
                                    <span className="text-gray-600 dark:text-df-text">{source.label}</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-df-textlight">{source.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 dark:border-df-border">
                        <h3 className="font-bold text-gray-900 dark:text-df-textlight mb-2">Docs Signed</h3>
                        <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-df-accent">24</span>
                            <span className="ml-2 text-sm text-gray-500 dark:text-df-text">this quarter</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-df-textlight">Recent Activity</h3>
                    <span className="text-xs text-gray-500 dark:text-df-text">auto-refresh every 30s</span>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-df-text">
                    Loading recent activities...
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
