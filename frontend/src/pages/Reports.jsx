import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import {
  FiDownload, FiBarChart2, FiActivity, FiUsers, FiTrendingUp,
  FiGlobe, FiTarget, FiDollarSign, FiAward, FiRefreshCw,
  FiGrid, FiList
} from 'react-icons/fi';
import { useAnalytics, exportToExcel } from '../hooks/useReports';

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT   = '#0ebf99';
const PURPLE   = '#9d7cff';
const PINK     = '#f06292';
const YELLOW   = '#f9c74f';
const BLUE     = '#4ea8de';
const ORANGE   = '#fb8500';

const PALETTE = [ACCENT, PURPLE, PINK, YELLOW, BLUE, ORANGE, '#52b788', '#e76f51'];

const STAGE_COLORS = {
  new:           '#4ea8de',
  contacted:     '#9d7cff',
  qualified:     YELLOW,
  proposal_sent: ORANGE,
  negotiation:   PINK,
  won:           ACCENT,
  lost:          '#ef4444',
  on_hold:       '#6b7280',
};

// ─── Tooltip styles ───────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { backgroundColor: '#10151b', borderColor: '#2a3441', borderRadius: 10, color: '#e2e8f0', fontSize: 12 },
  cursor: { fill: '#1a222b', opacity: 0.3 },
};

// ─── Helper: format currency ──────────────────────────────────────────────────
const fmt = (v) => {
  if (!v && v !== 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

// ─── Animated counter ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const target = Number(value);
    const step = target / 40;
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + step, target);
      setDisplay(cur);
      if (cur >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, prefix = '', suffix = '', color, icon: Icon, sub, decimals = 0 }) => (
  <div className="relative bg-white dark:bg-df-card rounded-2xl p-6 border border-gray-100 dark:border-df-border overflow-hidden group hover:shadow-lg hover:border-opacity-60 transition-all duration-300"
       style={{ '--hover-color': color }}>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl"
         style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }} />
    <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10" style={{ backgroundColor: color }} />
    <div className="flex items-start justify-between mb-3 relative z-10">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-df-text">{label}</div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <div className="text-3xl font-black text-gray-900 dark:text-df-textlight relative z-10 tracking-tight">
      <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
    </div>
    {sub && <div className="mt-2 text-xs font-medium relative z-10" style={{ color }}>{sub}</div>}
    <div className="mt-4 h-1 rounded-full bg-gray-100 dark:bg-gray-800 relative z-10">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((Number(value) / 100) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  </div>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color = ACCENT, children }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-bold text-gray-900 dark:text-df-textlight flex items-center gap-2">
      <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </span>
      {title}
    </h3>
    {children}
  </div>
);

// ─── Card wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, className = '', span = 1 }) => (
  <div className={`bg-white dark:bg-df-card rounded-2xl p-6 border border-gray-100 dark:border-df-border shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
       style={{ gridColumn: `span ${span}` }}>
    {children}
  </div>
);

// ─── Custom Legend ────────────────────────────────────────────────────────────
const ChartLegend = ({ items }) => (
  <div className="flex flex-wrap gap-3 mt-4">
    {items.map(({ label, color }) => (
      <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-df-text">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
    ))}
  </div>
);

// ─── Funnel Bar ───────────────────────────────────────────────────────────────
const FunnelBar = ({ item, max, index, total }) => {
  const pct = max > 0 ? (item.count / max) * 100 : 0;
  const gradColors = ['#18e1b1','#0ebf99','#0a9a7c','#087a63','#065c4b','#04443a','#ef4444','#6b7280'];
  return (
    <div className="relative group">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold text-gray-700 dark:text-df-textlight">{item.stage}</span>
        <span className="text-gray-400 dark:text-df-text font-medium">
          {item.count} leads &bull; {item.conversion_rate}%
        </span>
      </div>
      <div className="h-9 w-full bg-gray-100 dark:bg-[#12181f] rounded-xl overflow-hidden relative">
        <div
          className="h-full rounded-xl transition-all duration-1000 flex items-center justify-end pr-3"
          style={{ width: `${pct}%`, backgroundColor: gradColors[index % gradColors.length] }}
        >
          {pct > 15 && (
            <span className="text-white text-xs font-bold">{item.count}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Score bucket bar ─────────────────────────────────────────────────────────
const ScoreBar = ({ item }) => {
  const colors = { 'Cold (0-20)': '#6b7280', 'Warm (21-40)': BLUE, 'Hot (41-60)': YELLOW, 'Very Hot (61-80)': ORANGE, 'Champion (81-100)': ACCENT };
  const color = colors[item.bucket] || ACCENT;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs font-medium text-gray-500 dark:text-df-text truncate">{item.bucket}</div>
      <div className="flex-1 h-6 bg-gray-100 dark:bg-[#12181f] rounded-lg overflow-hidden">
        <div className="h-full rounded-lg flex items-center pl-2 transition-all duration-700"
             style={{ width: `${Math.min((item.count / 30) * 100, 100)}%`, backgroundColor: color }}>
          {item.count > 0 && <span className="text-white text-[10px] font-bold">{item.count}</span>}
        </div>
      </div>
      <div className="w-12 text-right text-xs font-bold" style={{ color }}>{item.count}</div>
    </div>
  );
};

// ─── Custom Pie label ─────────────────────────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Loading shimmer ──────────────────────────────────────────────────────────
const Shimmer = () => (
  <div className="animate-pulse space-y-6 p-6 md:p-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 dark:bg-df-card rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-gray-200 dark:bg-df-card rounded-2xl" />)}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Reports = () => {
  const [months, setMonths] = useState(6);
  const [exporting, setExporting] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useAnalytics(null, months);

  const handleExport = async () => {
    setExporting(true);
    try { await exportToExcel(); } finally { setExporting(false); }
  };

  if (isLoading) return <Shimmer />;

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-gray-500">
      <FiBarChart2 size={48} className="text-gray-300" />
      <div className="text-lg font-semibold">Could not load analytics</div>
      <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-df-accent text-black rounded-lg text-sm font-semibold">
        <FiRefreshCw size={14} /> Retry
      </button>
    </div>
  );

  const db          = data?.dashboard   ?? {};
  const funnel      = data?.funnel      ?? [];
  const trends      = data?.monthly_trends ?? [];
  const performance = data?.performance ?? [];
  const industry    = data?.industry    ?? [];
  const country     = data?.country     ?? [];
  const sourceRev   = data?.source_revenue ?? [];
  const topCompanies= data?.top_companies  ?? [];
  const scores      = data?.score_distribution ?? [];
  const turnaround  = data?.turnaround  ?? [];

  // Prepare source pie data
  const sourcePieData = sourceRev.map((s, i) => ({ name: s.source, value: s.count, color: PALETTE[i % PALETTE.length] }));

  // Prepare stage bar data from funnel
  const stageBarData = funnel.map(f => ({
    stage: f.stage || 'Unknown',
    count: f.count || 0,
    fill: STAGE_COLORS[f.stage?.toLowerCase()] || ACCENT,
  }));

  // Prepare industry bars
  const industryData = industry.slice(0, 8);

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-df-textlight tracking-tight">
            Analytics <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` }}>&amp; Reports</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-df-text mt-1">
            Live insights from your Neon database &bull; {db.total_leads ?? 0} leads tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="text-sm border border-gray-200 dark:border-df-border bg-white dark:bg-df-card text-gray-700 dark:text-df-textlight rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0ebf99]"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
            <option value={24}>Last 24 Months</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-df-border bg-white dark:bg-df-card text-gray-600 dark:text-df-text rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-df-cardhover transition-colors"
          >
            <FiRefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #089c7c)` }}
          >
            <FiDownload size={14} /> {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Win Rate"         value={db.win_rate_pct}           suffix="%" decimals={1} color={ACCENT}  icon={FiTarget}    sub="Closed deals ratio" />
        <KpiCard label="Pipeline Value"   value={db.estimated_pipeline_value} prefix="$" decimals={0} color={PURPLE}  icon={FiDollarSign} sub="Estimated revenue" />
        <KpiCard label="Total Leads"      value={db.total_leads}            color={BLUE}   icon={FiUsers}     sub={`+${db.leads_this_week ?? 0} this week`} />
        <KpiCard label="Avg Close (Days)" value={db.avg_turnaround_days}    suffix="d" decimals={1} color={YELLOW}  icon={FiActivity}  sub="Lead to Won" />
      </div>

      {/* ── Row 1: Monthly Trends + Conversion Funnel ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Trends (Area) */}
        <Card>
          <SectionHeader icon={FiTrendingUp} title="Monthly Growth Trends" color={PURPLE}>
            <ChartLegend items={[{ label: 'Total Leads', color: PURPLE }, { label: 'Won Leads', color: ACCENT }]} />
          </SectionHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="total_leads" stroke={PURPLE} strokeWidth={2.5} fill="url(#gradTotal)" name="Total Leads" dot={{ r: 3, fill: PURPLE }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="won_leads"   stroke={ACCENT}  strokeWidth={2.5} fill="url(#gradWon)"   name="Won Leads"   dot={{ r: 3, fill: ACCENT }}  activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <SectionHeader icon={FiBarChart2} title="Conversion Funnel" color={YELLOW} />
          <div className="space-y-3">
            {funnel.length > 0 ? funnel.map((item, i) => (
              <FunnelBar key={item.stage} item={item} max={funnel[0]?.count || 1} index={i} total={funnel.length} />
            )) : (
              <div className="text-center text-gray-400 py-10 text-sm">No funnel data yet</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 2: Lead Source Pie + Stage Distribution Bar ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Source Distribution (Donut) */}
        <Card>
          <SectionHeader icon={FiGrid} title="Leads by Source" color={ORANGE} />
          <div className="flex items-center gap-6">
            <div className="h-56 flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcePieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {sourcePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#10151b', borderColor: '#2a3441', borderRadius: 10, color: '#e2e8f0', fontSize: 12 }}
                    formatter={(v, n) => [v, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5 flex-shrink-0">
              {sourcePieData.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-df-textlight">{s.name}</div>
                    <div className="text-[10px] text-gray-400 dark:text-df-text">{s.value} leads</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stage Distribution (Horizontal Bar) */}
        <Card>
          <SectionHeader icon={FiList} title="Leads by Stage" color={BLUE} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageBarData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a3441" opacity={0.15} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} width={85} />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Leads']} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} name="Leads">
                  {stageBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Row 3: Source Revenue + Industry Breakdown ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Source Revenue (Grouped Bar) */}
        <Card>
          <SectionHeader icon={FiDollarSign} title="Pipeline Value by Source" color={ACCENT}>
            <ChartLegend items={[{ label: 'Leads', color: PURPLE }, { label: 'Pipeline $', color: ACCENT }]} />
          </SectionHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceRev} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.15} />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(v, n) => n === 'Pipeline $' ? [fmt(v), n] : [v, n]} />
                <Bar yAxisId="left"  dataKey="count"          fill={PURPLE} radius={[4,4,0,0]} barSize={18} name="Leads" />
                <Bar yAxisId="right" dataKey="pipeline_value" fill={ACCENT}  radius={[4,4,0,0]} barSize={18} name="Pipeline $" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Industry Breakdown */}
        <Card>
          <SectionHeader icon={FiGlobe} title="Top Industries" color={PINK} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={industryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.15} />
                <XAxis dataKey="industry" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 10 }}
                  tickFormatter={v => v.length > 12 ? v.slice(0,12)+'…' : v} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" radius={[4,4,0,0]} barSize={22} name="Leads">
                  {industryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Row 4: Turnaround by Source + Lead Score Distribution ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Turnaround (Bar) */}
        <Card>
          <SectionHeader icon={FiActivity} title="Turnaround Days by Source" color={BLUE} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnaround} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a3441" opacity={0.15} />
                <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(1)} days`]} />
                <Bar dataKey="avg_days" fill={BLUE} radius={[4,4,0,0]} barSize={36} name="Avg Days">
                  {turnaround.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Score Distribution */}
        <Card>
          <SectionHeader icon={FiTarget} title="Lead Score Distribution" color={YELLOW} />
          <div className="space-y-4 mt-2">
            {scores.length > 0 ? scores.map(item => (
              <ScoreBar key={item.bucket} item={item} />
            )) : (
              <div className="text-center text-gray-400 py-10 text-sm">No score data</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 5: Top Performers + Country Breakdown ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Salesperson Performance */}
        <Card>
          <SectionHeader icon={FiAward} title="Top Performers" color={ACCENT} />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 dark:text-df-text text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 dark:border-df-border">
                  <th className="pb-3 pr-2">Name</th>
                  <th className="pb-3 px-2 text-right">Assigned</th>
                  <th className="pb-3 px-2 text-right">Won</th>
                  <th className="pb-3 px-2 text-right">Win %</th>
                  <th className="pb-3 px-2 text-right">Avg Days</th>
                  <th className="pb-3 pl-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-df-border">
                {performance.length > 0 ? performance.map((p, i) => (
                  <tr key={p.salesperson} className="hover:bg-gray-50 dark:hover:bg-[#1a222b] transition-colors">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                             style={{ background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i+1) % PALETTE.length]})` }}>
                          {p.salesperson?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-df-textlight truncate max-w-[100px]">{p.salesperson || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-gray-600 dark:text-df-text">{p.leads_assigned}</td>
                    <td className="py-3 px-2 text-right text-sm font-bold text-gray-900 dark:text-df-textlight">{p.leads_won}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${p.win_rate >= 30 ? 'text-[#0ebf99] bg-[#0ebf99]/10' : 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {p.win_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-gray-500 dark:text-df-text">{p.avg_turnaround}d</td>
                    <td className="py-3 pl-2 text-right text-sm font-semibold" style={{ color: ACCENT }}>{fmt(p.total_value)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No performance data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Country Breakdown */}
        <Card>
          <SectionHeader icon={FiGlobe} title="Leads by Country" color={BLUE} />
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
            {country.length > 0 ? country.map((c, i) => {
              const pct = country[0]?.count > 0 ? (c.count / country[0].count) * 100 : 0;
              return (
                <div key={c.country} className="flex items-center gap-3">
                  <div className="w-6 text-center text-xs font-bold text-gray-400 dark:text-df-text">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700 dark:text-df-textlight truncate">{c.country}</span>
                      <span className="text-gray-400 dark:text-df-text ml-2 flex-shrink-0">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                           style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                    </div>
                  </div>
                  <div className="text-[11px] font-medium flex-shrink-0" style={{ color: ACCENT }}>{fmt(c.pipeline_value)}</div>
                </div>
              );
            }) : (
              <div className="text-center text-gray-400 py-8 text-sm">No country data</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Row 6: Top Companies ───────────────────────────────────────── */}
      <Card>
        <SectionHeader icon={FiDollarSign} title="Top Companies by Pipeline Value" color={PURPLE} />
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 dark:text-df-text text-[11px] font-bold uppercase tracking-wider border-b border-gray-100 dark:border-df-border">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Company</th>
                <th className="pb-3 px-4">Industry</th>
                <th className="pb-3 px-4 text-center">Leads</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 pl-4 text-right">Pipeline Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-df-border">
              {topCompanies.length > 0 ? topCompanies.map((c, i) => (
                <tr key={c.company} className="hover:bg-gray-50 dark:hover:bg-[#1a222b] transition-colors">
                  <td className="py-3 pr-4 text-sm font-bold text-gray-400 dark:text-df-text">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                           style={{ background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i+2) % PALETTE.length]})` }}>
                        {c.company?.charAt(0) || '?'}
                      </div>
                      <span className="font-semibold text-sm text-gray-900 dark:text-df-textlight">{c.company || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-df-text">{c.industry || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto"
                          style={{ backgroundColor: PURPLE }}>
                      {c.lead_count}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      c.status === 'Won' ? 'bg-[#0ebf99]/10 text-[#0ebf99]' :
                      c.status === 'Lost' ? 'bg-red-100 text-red-500 dark:bg-red-900/20' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span className="text-base font-black" style={{ color: ACCENT }}>{fmt(c.pipeline_value)}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No company data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Footer note ────────────────────────────────────────────────── */}
      <div className="text-center text-xs text-gray-400 dark:text-df-text pb-4">
        Data sourced live from Neon PostgreSQL &bull; Refreshes every 5 minutes &bull; Role-based data access applied
      </div>
    </div>
  );
};

export default Reports;
