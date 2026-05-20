import React from 'react';
import { useUpdateLeadStage } from '../../hooks/useLeadDetail';
import * as MdIcons from 'react-icons/md';

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal_sent', label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'won', label: 'Won' }
];

const LeadSummaryPanel = ({ lead, setActiveTab }) => {
  const updateStageMutation = useUpdateLeadStage();
  if (!lead) return null;

  const currentStageIndex = STAGES.findIndex(s => s.key === lead.status);
  
  const handleStageClick = (stageKey) => {
    updateStageMutation.mutate({ leadId: lead.id, stage: stageKey });
  };

  const getSourceIcon = (source) => {
    switch (source?.toLowerCase()) {
      case 'website': return <MdIcons.MdOutlineLanguage className="w-4 h-4 text-slate-500" />;
      case 'referral': return <MdIcons.MdPerson className="w-4 h-4 text-slate-500" />;
      default: return <MdIcons.MdBusinessCenter className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return `$${Number(val).toLocaleString()}`;
  };

  // Capitalize source
  const sourceLabel = lead.source ? lead.source.charAt(0).toUpperCase() + lead.source.slice(1) : 'Manual';
  
  // Format stage for status badge
  const statusLabel = lead.status ? lead.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New';

  // First letter of name for avatar
  const firstLetter = lead.first_name ? lead.first_name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 p-6 md:p-8">
      {/* Upper header section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
        
        {/* Left Side: Avatar and Info */}
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-lg bg-[#0ebf99] flex items-center justify-center text-white font-bold text-xl shadow-sm">
            {firstLetter}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {lead.job_title || 'Developer'} <span className="text-slate-300 mx-1.5">·</span> {lead.company_name || 'Sedin'} <span className="text-slate-300 mx-1.5">·</span> {lead.industry || 'IT Services'}
            </p>
            
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e5faef] text-[#0ebf99]">
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
                {getSourceIcon(lead.source)}
                {sourceLabel}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
                Score: {lead.lead_score ? lead.lead_score : '—'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
                Value: {lead.estimated_value && Number(lead.estimated_value) > 0 ? formatCurrency(lead.estimated_value) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab && setActiveTab('emails_calls')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors shadow-sm"
          >
            <MdIcons.MdOutlineEmail className="w-4 h-4 text-slate-500" />
            Email
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('emails_calls')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors shadow-sm"
          >
            <MdIcons.MdOutlineCall className="w-4 h-4 text-slate-500" />
            Call
          </button>
          <button 
            onClick={() => setActiveTab && setActiveTab('documents')}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0ebf99] hover:bg-[#0ca382] active:bg-[#0ba07f] rounded-lg text-sm font-semibold text-white transition-colors shadow-sm"
          >
            <MdIcons.MdOutlineDescription className="w-4 h-4 text-white" />
            Generate Doc
          </button>
        </div>

      </div>

      {/* Stage Progression Bar */}
      <div className="pt-6">
        <div className="w-full bg-white border border-slate-200 rounded-lg flex overflow-hidden shadow-sm">
          {STAGES.map((stage, idx) => {
            const isActive = idx <= currentStageIndex;
            return (
              <div
                key={stage.key}
                onClick={() => handleStageClick(stage.key)}
                className={`flex-1 py-3 px-2 text-center text-sm font-semibold border-r border-slate-100 last:border-r-0 cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? "text-[#0ebf99] bg-[#e5faef]/30 hover:bg-[#e5faef]/50" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                {stage.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LeadSummaryPanel;
