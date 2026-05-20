import React from 'react';
import { useMainDashboardStats } from '../hooks/useLeads';

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
    const { data: stats = {}, isLoading: loading } = useMainDashboardStats();

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
                    value={stats.totalLeads || 0} 
                    subtext="↑ Active leads in DB"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-accent"
                />
                <StatCard 
                    title="Pipeline Value" 
                    value={stats.pipelineValue || '$0'} 
                    subtext="↑ Active deals"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-purple"
                />
                <StatCard 
                    title="Docs Awaiting" 
                    value={stats.docsAwaiting || 0} 
                    subtext="Needs attention"
                    subtextColor="text-df-accent"
                    bgCircleColor="bg-df-yellow"
                />
                <StatCard 
                    title="Avg. Turnaround" 
                    value={`${stats.avgTurnaround || 0}d`} 
                    subtext="Overall efficiency"
                    subtextColor="text-gray-500"
                    bgCircleColor="bg-df-pink"
                />
            </div>

            {/* Pipeline by stage and leads by source */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 dark:text-df-textlight">Pipeline by Stage</h3>
                        <span className="text-xs text-gray-500 dark:text-df-text">All Divisions</span>
                    </div>
                    <div className="space-y-4">
                        {(stats.pipelineByStage || []).map((stage) => (
                            <div key={stage.label} className="flex items-center text-sm">
                                <span className="w-24 text-gray-600 dark:text-df-text">{stage.label}</span>
                                <div className="flex-1 ml-4 mr-4 bg-gray-100 dark:bg-[#10151b] h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${stage.color} rounded-full`} style={{ width: stage.width }}></div>
                                </div>
                                <span className="text-gray-900 dark:text-df-textlight w-4 text-right">{stage.count}</span>
                            </div>
                        ))}
                        {(!stats.pipelineByStage || stats.pipelineByStage.length === 0) && (
                            <div className="text-gray-500 text-sm py-4">No pipeline data available.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
                    <h3 className="font-bold text-gray-900 dark:text-df-textlight mb-6">Leads by Source</h3>
                    <div className="space-y-4">
                        {(stats.leadsBySource || []).map(source => (
                            <div key={source.label} className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <span className={`mr-2 ${source.dot}`}>●</span>
                                    <span className="text-gray-600 dark:text-df-text">{source.label}</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-df-textlight">{source.count}</span>
                            </div>
                        ))}
                        {(!stats.leadsBySource || stats.leadsBySource.length === 0) && (
                            <div className="text-gray-500 text-sm py-4">No source data available.</div>
                        )}
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 dark:border-df-border">
                        <h3 className="font-bold text-gray-900 dark:text-df-textlight mb-2">Docs Signed</h3>
                        <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-df-accent">{stats.docsSigned || 0}</span>
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
                <div className="space-y-4">
                    {(stats.recentActivity && stats.recentActivity.length > 0) ? (
                        stats.recentActivity.map(activity => (
                            <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-[#10151b] rounded-lg transition-colors border border-transparent dark:hover:border-df-border">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-df-card text-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold">{activity.event_type[0].toUpperCase()}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 dark:text-df-textlight">{activity.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(activity.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-df-text">
                            No recent activities found in the timeline.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
