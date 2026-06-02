import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import {
  FiActivity, FiUsers, FiTrendingUp,
  FiTarget, FiDollarSign, FiClock,
  FiCheckCircle, FiFileText
} from 'react-icons/fi';
import { useAnalytics } from '../hooks/useReports';

// ─── Design tokens (Matching Reports.jsx) ──────────────────────────────────────
const BLUE     = '#185FA5';
const GREEN    = '#1D9E75';
const AMBER    = '#EF9F27';
const RED      = '#E24B4A';
const PURPLE   = '#7F77DD';
const ACCENT   = '#0ebf99'; // DealFlow Teal

const PALETTE = [BLUE, GREEN, AMBER, RED, PURPLE, ACCENT];

// ─── Format Helpers ────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v && v !== 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

// ─── KPI Card (Sleek Bordered Style) ──────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, type = 'up' }) => (
  <div className="bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-xl p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="text-[11px] font-semibold text-gray-500 dark:text-df-text uppercase tracking-wider mb-2">{label}</div>
    <div className="text-2xl font-bold text-gray-900 dark:text-df-textlight mb-1">{value}</div>
    {sub && (
      <div className={`text-[10px] font-medium ${type === 'dn' ? 'text-red-500' : type === 'neu' ? 'text-gray-400' : 'text-green-500'}`}>
        {sub}
      </div>
    )}
    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
  </div>
);

// ─── Funnel Row ───────────────────────────────────────────────────────────────
const FunnelRow = ({ label, count, pct, color, dropPct }) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-20 text-[11px] font-medium text-gray-500 dark:text-df-text truncate">{label}</div>
      <div className="flex-1 bg-gray-50 dark:bg-[#0f171e] h-6 rounded overflow-hidden">
        <div 
          className="h-full flex items-center pl-2 transition-all duration-1000 relative" 
          style={{ width: `${pct}%`, backgroundColor: color }}
        >
          <span className="text-[10px] text-white font-bold">{count}</span>
        </div>
      </div>
      <div className="w-10 text-[10px] font-bold text-gray-400 text-right">
        {dropPct && dropPct !== '0%' ? `-${dropPct}` : ''}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1b] border border-[#222] p-3 rounded-lg shadow-xl text-white">
        <p className="text-[11px] font-bold mb-2 border-b border-white/10 pb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <span className="opacity-80">{p.name}:</span>
            <span className="font-bold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { data, isLoading } = useAnalytics(null, 6); // Default 6 months

  if (isLoading) return <div className="p-8 animate-pulse text-gray-400">Loading Dashboard...</div>;

  const dbStats = data?.dashboard || {};
  const trends = data?.monthly_trends || [];
  const funnel = data?.funnel || [];
  
  // Map and sort source revenue to match premium categories
  const sourceOrder = ['Google Ads', 'Referral', 'Manual', 'Event', 'Other'];
  const rawSourceRev = data?.source_revenue || [];
  const sourceRev = sourceOrder.map(label => {
    // Case-insensitive lookup to handle backend data variation (e.g., 'manual' vs 'Manual')
    const found = rawSourceRev.find(s => s.source.toLowerCase() === label.toLowerCase());
    return found ? { ...found, source: label } : { source: label, count: 0, pipeline_value: 0 };
  });
  const totalSourceCount = sourceRev.reduce((acc, s) => acc + s.count, 0);

  const performance = (data?.performance || []).slice(0, 4);
  
  // Hardcoded activity based on sample since timeline isn't fully separate yet
  const activity = [
    { id: 1, icon: <FiCheckCircle />, bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-600', title: 'SOW signed — Infra Corp', sub: 'Priya M. · $118K', time: '41m ago' },
    { id: 2, icon: <FiFileText />, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600', title: 'Proposal sent — Nexora Ltd', sub: 'Ravi S. · Quick deck', time: '2h ago' },
    { id: 3, icon: <FiClock />, bg: 'bg-purple-50 dark:bg-purple-900/20', color: 'text-purple-600', title: 'Email auto-linked', sub: 'Arjun K. · j.patel@acme.in', time: '3h ago' },
    { id: 4, icon: <FiUsers />, bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-600', title: 'Lead created — Infra Corp', sub: 'Google Ads · Enterprise', time: '4h ago' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-white dark:bg-df-sidebar p-4 rounded-xl border border-gray-100 dark:border-df-border">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-df-textlight">Sales Overview — Main Dashboard</h1>
          <p className="text-[11px] text-gray-500 dark:text-df-text mt-0.5">Last refreshed: today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-df-card flex items-center justify-center text-[10px] font-bold text-blue-600 border border-blue-100 dark:border-df-border">AM</div>
        </div>
      </div>

      {/* ── Insight Bar ────────────────────────────────────────────── */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 flex items-center gap-3">
        <FiTarget className="text-blue-600 dark:text-blue-400" />
        <span className="text-xs text-blue-800 dark:text-blue-300 flex-1 leading-relaxed">
          Win rate is {dbStats.win_rate_pct}% — Negotiation stage is the key lever. Focus on Proposal-to-close conversion this month.
        </span>
        <span className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-tighter">This Month</span>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total Leads" value={dbStats.total_leads} sub="↑ +12% vs prior" color={BLUE} />
        <KpiCard label="Deals Won" value={dbStats.leads_this_week || 0} sub="↑ +8% vs prior" color={GREEN} />
        <KpiCard label="Pipeline Value" value={fmt(dbStats.estimated_pipeline_value)} sub="Across all stages" color={PURPLE} type="neu" />
        <KpiCard label="Win Rate" value={`${dbStats.win_rate_pct}%`} sub="↓ -3pp vs prior" color={RED} type="dn" />
        <KpiCard label="Avg deal cycle" value={`${dbStats.avg_turnaround_days}d`} sub="↑ 2d faster" color={AMBER} />
      </div>

      {/* ── Charts Row 1 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-df-textlight">Monthly leads vs deals won</h3>
            <p className="text-[11px] text-gray-500 dark:text-df-text font-medium">Volume trend with win overlay</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_leads" fill="#185FA51a" stroke="#185FA5" radius={[3, 3, 0, 0]} name="Leads entered" barSize={40} />
                <Line type="monotone" dataKey="won_leads" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN, r: 4 }} name="Deals won" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-2xl p-5">
           <h3 className="text-sm font-bold text-gray-900 dark:text-df-textlight mb-4">Lead source mix</h3>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={sourceRev}
                   innerRadius={45}
                   outerRadius={65}
                   paddingAngle={4}
                   dataKey="count"
                 >
                   {sourceRev.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} strokeWidth={0} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 grid grid-cols-1 gap-2">
             {sourceRev.map((s, i) => {
               const percentage = totalSourceCount > 0 ? Math.round((s.count / totalSourceCount) * 100) : 0;
               return (
                 <div key={s.source} className="flex items-center gap-2 text-[10px]">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                   <span className="text-gray-500 dark:text-df-text truncate">{s.source}</span>
                   <span className="font-bold text-gray-900 dark:text-df-textlight ml-auto">{percentage}%</span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* ── Charts Row 2 ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-df-textlight mb-4 text-center">Pipeline funnel</h3>
          <div className="space-y-1">
            {funnel.map((f, i) => {
              const baseCount = funnel[0]?.count || 1;
              const prevCount = i > 0 ? funnel[i-1].count : baseCount;
              const pctOfFirst = Math.round((f.count / baseCount) * 100);
              const dropFromPrev = prevCount > 0 ? Math.round((1 - f.count / prevCount) * 100) : 0;
              
              return (
                <FunnelRow 
                  key={f.stage} 
                  label={f.stage} 
                  count={f.count} 
                  pct={pctOfFirst} 
                  color={PALETTE[i % PALETTE.length]}
                  dropPct={i > 0 ? `${dropFromPrev}%` : null}
                />
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-df-textlight mb-4">Revenue by owner</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="salesperson" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#999' }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_value" fill={BLUE} radius={[0, 4, 4, 0]} barSize={12} name="Won Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-df-card border border-gray-100 dark:border-df-border rounded-2xl p-5">
           <h3 className="text-sm font-bold text-gray-900 dark:text-df-textlight mb-4">Recent activity</h3>
           <div className="space-y-4">
             {activity.map(a => (
               <div key={a.id} className="flex gap-3 items-start">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.bg} ${a.color} text-sm`}>
                   {a.icon}
                 </div>
                 <div className="min-w-0 flex-1">
                   <div className="text-[11px] font-bold text-gray-900 dark:text-df-textlight truncate">{a.title}</div>
                   <div className="text-[10px] text-gray-500 dark:text-df-text truncate">{a.sub}</div>
                 </div>
                 <div className="text-[9px] text-gray-400 dark:text-df-text whitespace-nowrap mt-1">{a.time}</div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

