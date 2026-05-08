import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  FiDownload, FiFilter, FiBarChart2, FiActivity, FiUsers, FiTrendingUp 
} from 'react-icons/fi';
import { 
  useDashboardStats, useTurnaroundReport, useFunnelReport, 
  usePerformanceReport, useTrendsReport, exportToExcel 
} from '../hooks/useReports';

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
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500">Comprehensive overview of sales performance and lead lifecycle.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <FiDownload /> Export to Excel
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Win Rate</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.win_rate_pct}%</div>
          <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${stats?.win_rate_pct}%` }}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Avg Turnaround</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.avg_turnaround_days} Days</div>
          <div className="text-xs text-slate-400 mt-1">Lead to Won duration</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Pipeline Value</div>
          <div className="text-2xl font-bold text-slate-900">${stats?.estimated_pipeline_value?.toLocaleString()}</div>
          <div className="text-xs text-blue-500 mt-1">Potential revenue</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wider">Active Leads</div>
          <div className="text-2xl font-bold text-slate-900">{stats?.total_leads}</div>
          <div className="text-xs text-orange-500 mt-1">In progress</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Turnaround by Source */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <FiActivity className="text-indigo-500" /> Turnaround by Source (Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnaroundData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="avg_days" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} name="Avg Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FiTrendingUp className="text-emerald-500" /> Monthly Growth Trends
            </h3>
            <select 
              value={months} 
              onChange={(e) => setMonths(Number(e.target.value))}
              className="text-xs border-slate-200 rounded-md focus:ring-indigo-500"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="total_leads" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} name="Total Leads" />
                <Line type="monotone" dataKey="won_leads" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} name="Won Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-amber-500" /> Conversion Funnel
          </h3>
          <div className="space-y-4">
            {funnelData?.map((item, index) => (
              <div key={item.stage} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{item.stage}</span>
                  <span className="text-slate-500">{item.count} Leads ({item.conversion_rate}%)</span>
                </div>
                <div className="h-8 w-full bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500/80 transition-all duration-1000"
                    style={{ 
                      width: `${(item.count / (funnelData[0]?.count || 1)) * 100}%`,
                      backgroundColor: index === 0 ? '#6366f1' : index === funnelData.length - 1 ? '#10b981' : '#818cf8'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <FiUsers className="text-blue-500" /> Top Performers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-50">
                  <th className="pb-3 px-2">Salesperson</th>
                  <th className="pb-3 px-2">Won</th>
                  <th className="pb-3 px-2">Win Rate</th>
                  <th className="pb-3 px-2">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {performanceData?.map((person) => (
                  <tr key={person.salesperson} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {person.salesperson.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{person.salesperson}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 font-semibold text-slate-900">{person.leads_won}</td>
                    <td className="py-4 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        person.win_rate > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {person.win_rate}%
                      </span>
                    </td>
                    <td className="py-4 px-2 text-slate-500 text-sm">{person.avg_turnaround}d</td>
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
