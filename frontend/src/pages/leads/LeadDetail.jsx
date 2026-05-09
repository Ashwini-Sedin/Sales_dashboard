import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLeadDetail } from '../../hooks/useLeadDetail';
import LeadSummaryPanel from './LeadSummaryPanel';
import LeadTeamPanel from './LeadTeamPanel';
import LeadTimeline from './LeadTimeline';
import LeadEmailPanel from '../../components/lead/LeadEmailPanel';
import LeadCallsPanel from '../../components/lead/LeadCallsPanel';
import LeadDocumentsPanel from './LeadDocumentsPanel';
import { MdArrowBack } from 'react-icons/md';

const LeadDetail = () => {
  const { id } = useParams();
  const { data: lead, isLoading, error } = useLeadDetail(id);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading lead: {error.message}</div>;
  if (!lead) return <div className="p-8 text-center text-slate-500">Lead not found</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="mb-6">
        <Link to="/leads" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <MdArrowBack className="mr-1.5 w-4 h-4" /> Back to Leads
        </Link>
      </div>

      <LeadSummaryPanel lead={lead} />

      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 mb-6 rounded-t-xl overflow-hidden shadow-sm">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('communications')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'communications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Communications
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Documents
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <LeadTeamPanel lead={lead} />
          )}
          
          {activeTab === 'communications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LeadEmailPanel leadId={id} lead={lead} />
              <LeadCallsPanel leadId={id} />
            </div>
          )}

          {activeTab === 'documents' && (
            <LeadDocumentsPanel />
          )}
        </div>
        
        <div className="lg:col-span-1 h-[800px]">
          <LeadTimeline leadId={id} />
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
