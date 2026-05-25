import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  useLeadDetail, 
  useUpdateLead, 
  useUpdateLeadTeam 
} from '../../hooks/useLeadDetail';
import { useSocket } from '../../hooks/useSocket';
import LeadSummaryPanel from './LeadSummaryPanel';
import LeadTimeline from './LeadTimeline';
import LeadEmailPanel from '../../components/lead/LeadEmailPanel';
import LeadCallsPanel from '../../components/lead/LeadCallsPanel';
import DocumentsPanel from '../../components/documents/DocumentsPanel';
import { MdArrowBack } from 'react-icons/md';
import * as MdIcons from 'react-icons/md';

const LeadDetail = () => {
  const { id } = useParams();
  const { data: lead, isLoading, error } = useLeadDetail(id);
  const [activeTab, setActiveTab] = useState('360_overview');
  
  // Edit state for Contact Details
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({ email: '', phone: '', job_title: '', linkedin_id: '' });
  
  // Edit state for Company
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyData, setCompanyData] = useState({ company_name: '', industry: '', employees: '', website: '', hq_address: '', country: '' });
  
  // Edit state for Deal Info
  const [isEditingDeal, setIsEditingDeal] = useState(false);
  const [dealData, setDealData] = useState({ status: '', source: '', estimated_value: '', campaign_name: '' });
  
  // Inline edit state for Team Assigned card
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Sales Rep');
  
  // Inline edit state for Notes card
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  
  const updateTeamMutation = useUpdateLeadTeam();
  const updateLead = useUpdateLead();

  useSocket(id);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading lead: {error.message}</div>;
  if (!lead) return <div className="p-8 text-center text-slate-500">Lead not found</div>;

  const currentNotes = lead.notes || '';

  // Contact Details Handlers
  const handleStartEditingContact = () => {
    setContactData({
      email: lead.email || '',
      phone: lead.phone || '',
      job_title: lead.job_title || '',
      linkedin_id: lead.linkedin_id || ''
    });
    setIsEditingContact(true);
  };

  const handleSaveContact = () => {
    updateLead.mutate({ leadId: lead.id, data: contactData }, {
      onSuccess: () => {
        setIsEditingContact(false);
      }
    });
  };

  // Company Details Handlers
  const handleStartEditingCompany = () => {
    setCompanyData({
      company_name: lead.company_name || '',
      industry: lead.industry || '',
      employees: lead.employees || '',
      website: lead.website || '',
      hq_address: lead.hq_address || '',
      country: lead.country || ''
    });
    setIsEditingCompany(true);
  };

  const handleSaveCompany = () => {
    updateLead.mutate({ leadId: lead.id, data: companyData }, {
      onSuccess: () => {
        setIsEditingCompany(false);
      }
    });
  };

  // Deal Info Handlers
  const handleStartEditingDeal = () => {
    setDealData({
      status: lead.status || '',
      source: lead.source || '',
      estimated_value: lead.estimated_value || '',
      campaign_name: lead.campaign_name || ''
    });
    setIsEditingDeal(true);
  };

  const handleSaveDeal = () => {
    updateLead.mutate({ leadId: lead.id, data: dealData }, {
      onSuccess: () => {
        setIsEditingDeal(false);
      }
    });
  };

  const getCompanySize = (employees) => {
    if (!employees) return '—';
    if (employees < 50) return 'small';
    if (employees <= 500) return 'medium';
    return 'large';
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return `$${Number(val).toLocaleString()}`;
  };

  const handleAddTeamMember = (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    const currentTeam = lead.team || [];
    const updatedTeam = [...currentTeam, { email: newMemberEmail, role: newMemberRole }];
    
    updateTeamMutation.mutate({ leadId: lead.id, team: updatedTeam }, {
      onSuccess: () => {
        setIsAddingTeam(false);
        setNewMemberEmail('');
        setNewMemberRole('Sales Rep');
      }
    });
  };

  const handleRemoveTeamMember = (email) => {
    const currentTeam = lead.team || [];
    const updatedTeam = currentTeam.filter(member => member.email !== email);
    updateTeamMutation.mutate({ leadId: lead.id, team: updatedTeam });
  };

  const handleSaveNotes = () => {
    updateLead.mutate({ leadId: lead.id, data: { notes: noteContent } }, {
      onSuccess: () => {
        setIsEditingNotes(false);
      }
    });
  };

  const handleStartEditingNotes = () => {
    setNoteContent(currentNotes);
    setIsEditingNotes(true);
  };

  // Capitalize strings
  const sourceLabel = lead.source ? lead.source.charAt(0).toUpperCase() + lead.source.slice(1) : 'Manual';
  const statusLabel = lead.status ? lead.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'New';

  // Lead Score Gauge Parameters
  const score = lead.lead_score || 0;
  const radius = 40;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      
      {/* Back button */}
      <div className="mb-6">
        <Link to="/leads" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <MdArrowBack className="mr-1.5 w-4 h-4" /> Back to Leads
        </Link>
      </div>

      {/* Summary Header & Stage Progression */}
      <LeadSummaryPanel lead={lead} setActiveTab={setActiveTab} />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 mb-6 rounded-t-xl overflow-hidden shadow-sm">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('360_overview')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === '360_overview'
                ? 'border-[#0ebf99] text-[#0ebf99]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            360° Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'timeline'
                ? 'border-[#0ebf99] text-[#0ebf99]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-[#0ebf99] text-[#0ebf99]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('emails_calls')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'emails_calls'
                ? 'border-[#0ebf99] text-[#0ebf99]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Emails & Calls
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {activeTab === '360_overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* CARD 1: CONTACT DETAILS */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MdIcons.MdOutlinePersonOutline className="w-5 h-5 text-[#0ebf99]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</h3>
                </div>
                {!isEditingContact && (
                  <button 
                    onClick={handleStartEditingContact}
                    className="text-xs font-bold text-[#0ebf99] hover:text-[#0ca382] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingContact ? (
                <div className="flex-1 space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
                    <input
                      type="email"
                      value={contactData.email}
                      onChange={(e) => setContactData({...contactData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Job Title</label>
                    <input
                      type="text"
                      value={contactData.job_title}
                      onChange={(e) => setContactData({...contactData, job_title: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={contactData.linkedin_id}
                      onChange={(e) => setContactData({...contactData, linkedin_id: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingContact(false)}
                      className="text-xs font-bold text-slate-500 hover:bg-slate-100 py-1.5 px-3 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveContact}
                      disabled={updateLead.isPending}
                      className="bg-[#0ebf99] hover:bg-[#0ca382] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                    >
                      {updateLead.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Email</span>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-[#0ebf99] hover:underline font-semibold">{lead.email}</a>
                    ) : (
                      <span className="text-slate-600 font-semibold">—</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Phone</span>
                    <span className="text-slate-800 font-semibold">{lead.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Title</span>
                    <span className="text-slate-800 font-semibold">{lead.job_title || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">LinkedIn</span>
                    {lead.linkedin_id ? (
                      <a href={lead.linkedin_id} target="_blank" rel="noopener noreferrer" className="text-[#0ebf99] hover:underline font-semibold">View Profile</a>
                    ) : (
                      <span className="text-slate-600 font-semibold">—</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: COMPANY */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MdIcons.MdOutlineBusiness className="w-5 h-5 text-[#0ebf99]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company</h3>
                </div>
                {!isEditingCompany && (
                  <button 
                    onClick={handleStartEditingCompany}
                    className="text-xs font-bold text-[#0ebf99] hover:text-[#0ca382] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingCompany ? (
                <div className="flex-1 space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyData.company_name}
                      onChange={(e) => setCompanyData({...companyData, company_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={companyData.industry}
                      onChange={(e) => setCompanyData({...companyData, industry: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Employees</label>
                    <input
                      type="number"
                      value={companyData.employees}
                      onChange={(e) => setCompanyData({...companyData, employees: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Website</label>
                    <input
                      type="url"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">HQ Address</label>
                    <input
                      type="text"
                      value={companyData.hq_address}
                      onChange={(e) => setCompanyData({...companyData, hq_address: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Country</label>
                    <input
                      type="text"
                      value={companyData.country}
                      onChange={(e) => setCompanyData({...companyData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingCompany(false)}
                      className="text-xs font-bold text-slate-500 hover:bg-slate-100 py-1.5 px-3 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCompany}
                      disabled={updateLead.isPending}
                      className="bg-[#0ebf99] hover:bg-[#0ca382] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                    >
                      {updateLead.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Company</span>
                    <span className="text-slate-800 font-semibold">{lead.company_name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Industry</span>
                    <span className="text-slate-800 font-semibold">{lead.industry || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Size</span>
                    <span className="text-slate-800 font-semibold">{getCompanySize(lead.employees)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Website</span>
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-[#0ebf99] hover:underline font-semibold">
                        {lead.website.replace('https://', '').replace('http://', '').split('/')[0]}
                      </a>
                    ) : (
                      <span className="text-slate-600 font-semibold">—</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">HQ</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[200px]" title={lead.hq_address}>{lead.hq_address || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Country</span>
                    <span className="text-slate-800 font-semibold">{lead.country || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 3: DEAL INFO */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MdIcons.MdOutlineMonetizationOn className="w-5 h-5 text-[#0ebf99]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deal Info</h3>
                </div>
                {!isEditingDeal && (
                  <button 
                    onClick={handleStartEditingDeal}
                    className="text-xs font-bold text-[#0ebf99] hover:text-[#0ca382] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingDeal ? (
                <div className="flex-1 space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Stage</label>
                    <select
                      value={dealData.status}
                      onChange={(e) => setDealData({...dealData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs bg-white"
                    >
                      <option value="">Select Stage</option>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal_sent">Proposal Sent</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Source</label>
                    <select
                      value={dealData.source}
                      onChange={(e) => setDealData({...dealData, source: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs bg-white"
                    >
                      <option value="">Select Source</option>
                      <option value="manual">Manual</option>
                      <option value="google_ads">Google Ads</option>
                      <option value="referral">Referral</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Estimated Value</label>
                    <input
                      type="number"
                      value={dealData.estimated_value}
                      onChange={(e) => setDealData({...dealData, estimated_value: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                      placeholder="Enter value in USD"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={dealData.campaign_name}
                      onChange={(e) => setDealData({...dealData, campaign_name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingDeal(false)}
                      className="text-xs font-bold text-slate-500 hover:bg-slate-100 py-1.5 px-3 rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDeal}
                      disabled={updateLead.isPending}
                      className="bg-[#0ebf99] hover:bg-[#0ca382] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                    >
                      {updateLead.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 space-y-4 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Stage</span>
                    <span className="text-[#0ebf99] font-bold">{statusLabel}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Source</span>
                    <span className="text-slate-800 font-semibold">{sourceLabel}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Value</span>
                    <span className="text-slate-800 font-bold">{formatCurrency(lead.estimated_value)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Budget</span>
                    <span className="text-slate-800 font-semibold">—</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Campaign</span>
                    <span className="text-slate-800 font-semibold">{lead.campaign_name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-medium">Owner</span>
                    <span className="text-slate-800 font-semibold">—</span>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 4: LEAD SCORE */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-6 self-start w-full">
                <MdIcons.MdOutlineStars className="w-5 h-5 text-[#0ebf99]" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Score</h3>
              </div>
              
              {/* Circular Gauge */}
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-slate-100 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  {/* Colored indicator */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-[#0ebf99] fill-none transition-all duration-1000 ease-out"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center score text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-900">{score}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">out of 100</span>
                </div>
              </div>

              {/* Description */}
              <div className="text-center mt-6">
                <p className="text-sm font-semibold text-slate-700">
                  {score >= 70 ? 'High conversion potential' : score >= 40 ? 'Moderate interest registered' : 'Low initial engagement'}
                </p>
                <p className="text-xs text-slate-400 mt-1">AI-analyzed activity history and profile parameters.</p>
              </div>
            </div>

            {/* CARD 5: TEAM ASSIGNED */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-2">
                  <MdIcons.MdOutlinePeopleOutline className="w-5 h-5 text-[#0ebf99]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Assigned</h3>
                </div>
                <button 
                  onClick={() => setIsAddingTeam(!isAddingTeam)}
                  className="text-xs font-bold text-[#0ebf99] hover:text-[#0ca382] transition-colors flex items-center gap-0.5"
                >
                  {isAddingTeam ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {/* Add form inside card */}
              {isAddingTeam && (
                <form onSubmit={handleAddTeamMember} className="mb-4 p-3 bg-[#e5faef]/20 border border-[#0ebf99]/20 rounded-lg flex flex-col gap-2 transition-all">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Enter email..."
                    required
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99]"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="text-xs py-1.5 px-2 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#0ebf99]"
                    >
                      <option value="Sales Rep">Sales Rep</option>
                      <option value="Account Executive">Account Executive</option>
                      <option value="Solutions Engineer">Solutions Engineer</option>
                      <option value="Manager">Manager</option>
                    </select>
                    <button
                      type="submit"
                      disabled={updateTeamMutation.isPending}
                      className="bg-[#0ebf99] hover:bg-[#0ca382] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* Team list */}
              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3">
                {lead.team && lead.team.length > 0 ? (
                  lead.team.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#0ebf99] text-sm shrink-0 border border-slate-200">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={member.email}>{member.email}</p>
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveTeamMember(member.email)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Remove Member"
                      >
                        <MdIcons.MdOutlineClose className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 text-xs py-8">
                    No team members assigned yet.
                  </div>
                )}
              </div>
            </div>

            {/* CARD 6: NOTES */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center gap-2">
                  <MdIcons.MdOutlineDescription className="w-5 h-5 text-[#0ebf99]" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</h3>
                </div>
                {!isEditingNotes && (
                  <button 
                    onClick={handleStartEditingNotes}
                    className="text-xs font-bold text-[#0ebf99] hover:text-[#0ca382] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                {isEditingNotes ? (
                  <div className="flex flex-col gap-2 h-full">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#0ebf99] focus:border-[#0ebf99] min-h-[120px] flex-1 resize-none"
                      placeholder="Write permanent notes for this lead..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="text-xs font-bold text-slate-500 hover:bg-slate-100 py-1.5 px-3 rounded transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={updateLead.isPending}
                        className="bg-[#0ebf99] hover:bg-[#0ca382] text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                      >
                        {updateLead.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap flex-1 italic bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                    {currentNotes ? currentNotes : 'No notes yet.'}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto h-[800px]">
            <LeadTimeline leadId={id} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="max-w-5xl mx-auto">
            <DocumentsPanel leadId={id} lead={lead} />
          </div>
        )}

        {activeTab === 'emails_calls' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadEmailPanel leadId={id} lead={lead} />
            <LeadCallsPanel leadId={id} />
          </div>
        )}
      </div>

    </div>
  );
};

export default LeadDetail;
