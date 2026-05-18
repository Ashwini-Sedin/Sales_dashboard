import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { 
  FiDownload, FiBarChart2, FiActivity, FiUsers, FiTrendingUp 
} from 'react-icons/fi';
import { 
  useDashboardStats, useTurnaroundReport, useFunnelReport, 
  usePerformanceReport, useTrendsReport, exportToExcel 
} from '../hooks/useReports';

// eslint-disable-next-line no-unused-vars
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [months, setMonths] = useState(6);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: turnaroundData, isLoading: turnaroundLoading } = useTurnaroundReport();
  const { data: funnelData, isLoading: funnelLoading } = useFunnelReport();
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceReport();
  const { data: trendsData, isLoading: trendsLoading } = useTrendsReport(null, months);

  const handleExport = () => {
    exportToExcel();
  };

  if (statsLoading || turnaroundLoading || funnelLoading || performanceLoading || trendsLoading) {
    return <div className="flex items-center justify-center h-screen text-slate-500">Loading Analytics...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-df-textlight">Analytics & Reports</h1>
          <p className="text-gray-500 dark:text-df-text">Comprehensive overview of sales performance and lead lifecycle.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#0ebf99] dark:bg-df-accent text-white dark:text-black px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-semibold"
        >
          <FiDownload /> Export to Excel
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border relative overflow-hidden group hover:border-[#0ebf99]/50 transition-colors">
          <div className="text-gray-500 dark:text-df-text text-sm font-semibold mb-4 uppercase tracking-wider relative z-10">Win Rate</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-df-textlight mb-2 relative z-10">{stats?.win_rate_pct}%</div>
          <div className="mt-2 h-1.5 w-full bg-gray-100 dark:bg-[#1a222c] rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-[#0ebf99]" style={{ width: `${stats?.win_rate_pct}%` }}></div>
          </div>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20 bg-df-accent"></div>
        </div>
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border relative overflow-hidden group hover:border-[#0ebf99]/50 transition-colors">
          <div className="text-gray-500 dark:text-df-text text-sm font-semibold mb-4 uppercase tracking-wider relative z-10">Avg Turnaround</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-df-textlight mb-2 relative z-10">{stats?.avg_turnaround_days} Days</div>
          <div className="text-[11px] text-gray-400 dark:text-df-text relative z-10">Lead to Won duration</div>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20 bg-df-pink"></div>
        </div>
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border relative overflow-hidden group hover:border-[#0ebf99]/50 transition-colors">
          <div className="text-gray-500 dark:text-df-text text-sm font-semibold mb-4 uppercase tracking-wider relative z-10">Pipeline Value</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-df-textlight mb-2 relative z-10">${stats?.estimated_pipeline_value?.toLocaleString()}</div>
          <div className="text-[11px] text-[#0ebf99] relative z-10">Potential revenue</div>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20 bg-df-purple"></div>
        </div>
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border relative overflow-hidden group hover:border-[#0ebf99]/50 transition-colors">
          <div className="text-gray-500 dark:text-df-text text-sm font-semibold mb-4 uppercase tracking-wider relative z-10">Active Leads</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-df-textlight mb-2 relative z-10">{stats?.total_leads}</div>
          <div className="text-[11px] text-orange-500 relative z-10">In progress</div>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 dark:opacity-20 bg-df-yellow"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Turnaround by Source */}
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-df-textlight mb-6 flex items-center gap-2">
            <FiActivity className="text-[#0ebf99]" /> Turnaround by Source (Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnaroundData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.2} />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#10151b', borderColor: '#2a3441', color: '#fff' }}
                  cursor={{ fill: '#1a222b', opacity: 0.4 }}
                />
                <Bar dataKey="avg_days" fill="#0ebf99" radius={[4, 4, 0, 0]} barSize={40} name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-df-textlight flex items-center gap-2">
              <FiTrendingUp className="text-[#0ebf99]" /> Monthly Growth Trends
            </h3>
            <select 
              value={months} 
              onChange={(e) => setMonths(Number(e.target.value))}
              className="text-xs border-gray-200 dark:border-df-border bg-transparent text-gray-600 dark:text-df-text rounded-md focus:ring-[#0ebf99]"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#10151b', borderColor: '#2a3441', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="total_leads" stroke="#9d7cff" strokeWidth={3} dot={{ r: 4, fill: '#9d7cff' }} activeDot={{ r: 6 }} name="Total Leads" />
                <Line type="monotone" dataKey="won_leads" stroke="#0ebf99" strokeWidth={3} dot={{ r: 4, fill: '#0ebf99' }} activeDot={{ r: 6 }} name="Won Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-df-textlight mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-df-yellow" /> Conversion Funnel
          </h3>
          <div className="space-y-4">
            {funnelData?.map((item, index) => (
              <div key={item.stage} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-gray-700 dark:text-df-textlight">{item.stage}</span>
                  <span className="text-gray-500 dark:text-df-text">{item.count} Leads ({item.conversion_rate}%)</span>
                </div>
                <div className="h-8 w-full bg-gray-100 dark:bg-[#12181f] rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-opacity-80 transition-all duration-1000"
                    style={{ 
                      width: `${(item.count / (funnelData[0]?.count || 1)) * 100}%`,
                      backgroundColor: index === 0 ? '#18e1b1' : index === funnelData.length - 1 ? '#0ebf99' : '#14b8a6'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-white dark:bg-df-card p-6 rounded-xl border border-gray-100 dark:border-df-border overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 dark:text-df-textlight mb-6 flex items-center gap-2">
            <FiUsers className="text-[#0ebf99]" /> Top Performers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 dark:text-df-text text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-df-border">
                  <th className="pb-3 px-2">Salesperson</th>
                  <th className="pb-3 px-2">Won</th>
                  <th className="pb-3 px-2">Win Rate</th>
                  <th className="pb-3 px-2">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-df-border">
                {performanceData?.map((person) => (
                  <tr key={person.salesperson} className="hover:bg-gray-50 dark:hover:bg-[#1a222b] transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0ebf99]/10 text-[#0ebf99] flex items-center justify-center font-bold text-xs">
                          {person.salesperson.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-df-textlight">{person.salesperson}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 font-semibold text-gray-900 dark:text-df-textlight">{person.leads_won}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        person.win_rate > 30 ? 'bg-[#e5faef] text-[#0ebf99] dark:bg-[#0ebf99]/10' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {person.win_rate}%
                      </span>
                    </td>
                    <td className="py-4 px-2 text-gray-500 dark:text-df-text text-sm">{person.avg_turnaround}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
