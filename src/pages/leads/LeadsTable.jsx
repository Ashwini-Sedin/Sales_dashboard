import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StageBadge from './StageBadge';

const getFrontendStage = (status) => {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s === 'new') return 'New';
  if (s === 'contacted') return 'Contacted';
  if (s === 'qualified') return 'Qualified';
  if (s === 'proposal_sent' || s === 'proposal') return 'Proposal';
  if (s === 'negotiation') return 'Negotiation';
  if (s === 'won' || s === 'closed_won' || s === 'closed won') return 'Closed Won';
  if (s === 'lost' || s === 'closed_lost' || s === 'closed lost') return 'Closed Lost';
  return 'New';
};

const LeadsTable = ({ leads, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading leads...</div>;
  if (!leads || leads.length === 0) return <div className="p-8 text-center text-gray-500">No leads found.</div>;

  const sortedLeads = [...leads].sort((a, b) => {
    let keyA = a[sortConfig.key];
    let keyB = b[sortConfig.key];

    // Fallbacks for mapped properties
    if (sortConfig.key === 'name') {
      keyA = `${a.first_name || ''} ${a.last_name || ''}`;
      keyB = `${b.first_name || ''} ${b.last_name || ''}`;
    } else if (sortConfig.key === 'company') {
      keyA = a.company_name || '';
      keyB = b.company_name || '';
    } else if (sortConfig.key === 'score') {
      keyA = a.lead_score || 0;
      keyB = b.lead_score || 0;
    } else if (sortConfig.key === 'stage') {
      keyA = getFrontendStage(a.status);
      keyB = getFrontendStage(b.status);
    }

    if (keyA < keyB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (keyA > keyB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const getScoreColor = (score) => {
    if (!score) return 'border-slate-300 text-transparent';
    if (score >= 80) return 'border-[#0ebf99] text-[#0ebf99]';
    if (score >= 40) return 'border-[#a3e635] text-[#84cc16]';
    return 'border-slate-400 text-slate-600';
  };


  const formatSource = (source) => {
    if (!source) return 'Manual';
    if (source.toLowerCase() === 'google_ads') return 'Google Ads';
    return source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
  };

  const formatTableValue = (val) => {
    if (!val || Number(val) === 0) return '—';
    const num = Number(val);
    
    // In our system, if it's already configured as e.g. 2200000, let's represent in lakhs (L)
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(0)}L`;
    }
    return `₹${(num / 1000).toFixed(0)}K`;
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Trigger when within 100px of the bottom
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#141a21] rounded-lg border border-gray-200 dark:border-df-border h-full flex flex-col overflow-hidden">
      <div className="overflow-auto flex-1" onScroll={handleScroll}>
        <table className="min-w-full text-left table-auto">
          <thead className="bg-gray-50 dark:bg-[#10151b] border-b border-gray-200 dark:border-df-border sticky top-0 z-10">
            <tr>
              <th onClick={() => requestSort('name')} className="cursor-pointer px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Name {getSortIcon('name')}
              </th>
              <th onClick={() => requestSort('company')} className="cursor-pointer px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Company {getSortIcon('company')}
              </th>
              <th onClick={() => requestSort('source')} className="cursor-pointer px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Source {getSortIcon('source')}
              </th>
              <th onClick={() => requestSort('stage')} className="cursor-pointer px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Stage {getSortIcon('stage')}
              </th>

              <th onClick={() => requestSort('score')} className="cursor-pointer px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Score {getSortIcon('score')}
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Value
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-wider bg-gray-50 dark:bg-[#10151b]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-df-border">
            {sortedLeads.map((lead) => (
              <tr key={lead.id} className="bg-white dark:bg-[#141a21] hover:bg-gray-50 dark:hover:bg-[#1a222b] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/leads/${lead.id}`} className="text-sm font-bold text-gray-900 dark:text-df-textlight hover:text-[#0ebf99] transition-colors">
                    {lead.first_name} {lead.last_name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-500 dark:text-df-text">{lead.company_name || 'No Company'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-df-text">{formatSource(lead.source)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StageBadge stage={getFrontendStage(lead.status)} />
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${getScoreColor(lead.lead_score)}`}>
                    {lead.lead_score || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-df-text">{formatTableValue(lead.estimated_value)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link to={`/leads/${lead.id}`} className="flex items-center gap-1 text-[#0ebf99] hover:text-teal-400 transition-colors">
                    View <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </Link>
                </td>
              </tr>
            ))}
            {isFetchingNextPage && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-[#0ebf99] py-2">
                    <div className="w-5 h-5 border-2 border-[#0ebf99] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-gray-500 dark:text-df-text">Loading more leads...</span>
                  </div>
                </td>
              </tr>
            )}
            {!hasNextPage && sortedLeads.length > 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-50/30 dark:bg-[#10151b]/30">
                  Showing all {sortedLeads.length} leads
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;
