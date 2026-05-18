import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiLoader, FiCheckCircle, FiFileText, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const documentTypes = [
  { id: 'quick_sales', title: 'Quick Sales', time: '5 min', format: 'PPTX', icon: '⚡' },
  { id: 'detailed_proposal', title: 'Detailed Proposal', time: '15 min', format: 'DOCX', icon: '📋' },
  { id: 'presales_doc', title: 'Presales Doc', time: '20 min', format: 'DOCX', icon: '🔍' },
  { id: 'nda', title: 'NDA', time: '5 min', format: 'PDF', icon: '🤝' },
  { id: 'sow', title: 'SOW', time: '30 min', format: 'DOCX', icon: '📄' }
];

const GenerateDoc = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState('quick_sales');
  
  // Search & Lead selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const dropdownRef = useRef(null);

  // Dynamic input fields
  const [clientName, setClientName] = useState('Priya Mehta');
  const [clientCompany, setClientCompany] = useState('TechNova Pvt Ltd');
  const [proposedSolution, setProposedSolution] = useState('Cloud Migration Accelerator');
  const [priceFrom, setPriceFrom] = useState('15,00,000');
  const [priceTo, setPriceTo] = useState('25,00,000');
  const [startDate, setStartDate] = useState('01 May 2026');
  const [deliveryDate, setDeliveryDate] = useState('30 Sep 2026');

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [draftedContent, setDraftedContent] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch leads based on search query
  useEffect(() => {
    const fetchLeads = async () => {
      if (!searchQuery.trim()) {
        setLeads([]);
        return;
      }
      try {
        const response = await api.get(`/api/leads?q=${searchQuery}`);
        setLeads(response.data.items || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    const timer = setTimeout(fetchLeads, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setSearchQuery(`${lead.first_name} ${lead.last_name}`);
    setClientName(`${lead.first_name} ${lead.last_name}`);
    setClientCompany(lead.company_name || '');
    setShowDropdown(false);
    toast.success(`Connected to Lead: ${lead.first_name}`);
  };

  // Step 1: Draft the content with GateLLM and display it live in the UI
  const handleDraftWithLLM = async () => {
    if (!selectedLead) {
      toast.error('Please search and select a lead first using the top search bar!');
      return;
    }

    setIsGenerating(true);
    setDraftedContent(null);
    setGenerationStep('🧠 Initializing GateLLM to generate rich content...');

    try {
      const response = await api.post('/api/documents/draft-with-llm', {
        lead_id: selectedLead.id,
        doc_type: selectedDoc,
        format: selectedDoc === 'quick_sales' ? 'pptx' : 'docx',
        client_name: clientName,
        client_company: clientCompany,
        proposed_solution: proposedSolution,
        price_from: priceFrom,
        price_to: priceTo,
        start_date: startDate,
        delivery_date: deliveryDate
      });

      setDraftedContent(response.data);
      setGenerationStep('✨ GateLLM content generation successful! Review it below.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'GateLLM failed to generate draft content.');
      setIsGenerating(false);
    }
  };

  // Step 2: User reviews and approves, trigger document task
  const handleCompileDocument = async () => {
    setGenerationStep('⚙️ Submitting AI values and enqueuing document compiler...');
    
    try {
      await api.post('/api/documents/generate-with-llm', {
        lead_id: selectedLead.id,
        doc_type: selectedDoc,
        format: selectedDoc === 'quick_sales' ? 'pptx' : 'docx',
        client_name: clientName,
        client_company: clientCompany,
        proposed_solution: proposedSolution,
        price_from: priceFrom,
        price_to: priceTo,
        start_date: startDate,
        delivery_date: deliveryDate
      });

      setGenerationStep('💾 Document queued! Syncing with S3 & SharePoint...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Document successfully queued for generation!');
      setIsGenerating(false);
      navigate('/documents');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to compile final document.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Loading & Interactive Content Review Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-[#141a21] border border-df-border rounded-2xl p-8 max-w-2xl w-full flex flex-col shadow-2xl transition-all max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              {!draftedContent ? (
                <FiLoader className="animate-spin text-3xl text-df-accent" />
              ) : (
                <FiCheckCircle className="text-3xl text-df-accent" />
              )}
              <div>
                <h3 className="text-xl font-bold">GateLLM Content Generator</h3>
                <p className="text-gray-400 text-xs mt-1">{generationStep}</p>
              </div>
            </div>

            {/* Render dynamically drafted content from LLM */}
            {draftedContent ? (
              <div className="space-y-6 text-left border-y border-df-border py-6 my-4 overflow-y-auto max-h-[50vh] pr-2">
                <div>
                  <h4 className="text-xs font-bold text-df-accent uppercase tracking-widest mb-2">Refined Solution Name</h4>
                  <p className="bg-[#10151b] px-4 py-3 rounded-lg border border-[#2a3441] text-sm text-white font-medium">
                    {draftedContent.proposed_solution_name}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-df-accent uppercase tracking-widest mb-2">Estimated Pricing Range</h4>
                  <p className="bg-[#10151b] px-4 py-3 rounded-lg border border-[#2a3441] text-sm text-white font-medium">
                    {draftedContent.pricing_range}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-df-accent uppercase tracking-widest mb-2">GateLLM Drafted Client Challenges</h4>
                  <ul className="space-y-2">
                    {draftedContent.client_challenges.map((challenge, idx) => (
                      <li key={idx} className="bg-[#10151b]/60 px-4 py-2.5 rounded-lg border border-df-border/30 text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-red-400 font-bold mt-0.5">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-df-accent uppercase tracking-widest mb-2">GateLLM Drafted Key Benefits</h4>
                  <ul className="space-y-2">
                    {draftedContent.key_benefits.map((benefit, idx) => (
                      <li key={idx} className="bg-[#10151b]/60 px-4 py-2.5 rounded-lg border border-df-border/30 text-xs text-gray-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-df-accent font-bold mt-0.5">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                Compiling intelligence, researching company background...
              </div>
            )}

            {/* Action buttons once content is generated */}
            {draftedContent && (
              <div className="flex gap-4 mt-4 justify-end">
                <button
                  onClick={handleDraftWithLLM}
                  className="bg-transparent border border-df-border text-gray-300 hover:text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <FiRefreshCw /> Regenerate Draft
                </button>
                <button
                  onClick={handleCompileDocument}
                  className="bg-df-accent hover:bg-opacity-90 text-white dark:text-black px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
                >
                  <FiCheck /> Approve & Compile Document
                </button>
              </div>
            )}

            {/* Cancel Button */}
            {!draftedContent && (
              <button
                onClick={() => setIsGenerating(false)}
                className="mt-4 text-xs text-gray-500 hover:text-gray-400 underline transition-colors"
              >
                Cancel Generation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-df-border">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-df-textlight">Generate Document</h1>
          {selectedLead && (
            <p className="text-xs text-df-accent mt-1 flex items-center gap-1 font-semibold">
              <FiCheckCircle /> Linked to Lead: {selectedLead.first_name} {selectedLead.last_name} ({selectedLead.company_name})
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400 dark:text-df-text" />
            <input
              type="text"
              placeholder="Search leads to connect..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-df-border bg-transparent rounded-lg w-72 focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none text-sm text-gray-900 dark:text-df-textlight transition-colors"
            />

            {/* Lead Search Dropdown */}
            {showDropdown && leads.length > 0 && (
              <div className="absolute right-0 top-12 bg-white dark:bg-[#141a21] border border-gray-100 dark:border-df-border rounded-xl shadow-xl w-72 max-h-60 overflow-y-auto z-40">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-df-card border-b border-gray-100 dark:border-df-border last:border-0 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-sm text-gray-950 dark:text-white">
                      {lead.first_name} {lead.last_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lead.company_name || 'No Company'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/leads')}
            className="bg-df-accent hover:bg-opacity-90 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors text-sm"
          >
            <FiPlus /> New Lead
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl">
        <h2 className="text-sm font-medium text-gray-600 dark:text-df-text mb-4">Select document type</h2>
        
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
          {documentTypes.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border min-w-[160px] transition-all duration-200 ${
                selectedDoc === doc.id
                  ? 'border-df-accent bg-df-accent/5 shadow-[0_0_15px_rgba(24,225,177,0.1)]'
                  : 'border-gray-200 dark:border-df-border bg-white dark:bg-df-card hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">{doc.icon}</div>
              <div className="font-semibold text-gray-900 dark:text-df-textlight text-sm">{doc.title}</div>
              <div className="text-xs text-gray-500 dark:text-df-text mt-1">{doc.time} · {doc.format}</div>
            </button>
          ))}
        </div>

        {/* Auto-Filled Section */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-widest mb-4">
            AUTO-FILLED (FROM COMPANY PROFILE)
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Company</label>
              <input
                type="text"
                disabled
                value="DealFlow Technologies Pvt Ltd"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-df-border bg-gray-50 dark:bg-[#10151b] text-gray-500 dark:text-gray-400 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Division</label>
              <input
                type="text"
                disabled
                value="Cloud Solutions Division"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-df-border bg-gray-50 dark:bg-[#10151b] text-gray-500 dark:text-gray-400 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Division Head</label>
              <input
                type="text"
                disabled
                value="Deepak Malhotra"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-df-border bg-gray-50 dark:bg-[#10151b] text-gray-500 dark:text-gray-400 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Salesperson</label>
              <input
                type="text"
                disabled
                value={user ? `${user.first_name} ${user.last_name}` : 'Arjun Kumar'}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-df-border bg-gray-50 dark:bg-[#10151b] text-gray-500 dark:text-gray-400 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Inputs Section */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-gray-500 dark:text-df-text uppercase tracking-widest mb-4">
            DYNAMIC INPUTS (CLIENT-SPECIFIC)
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Client Company</label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Proposed Solution</label>
              <input
                type="text"
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Price From (₹)</label>
              <input
                type="text"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Price To (₹)</label>
              <input
                type="text"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Start Date</label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-df-textlight mb-2">Delivery Date</label>
              <input
                type="text"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] bg-white dark:bg-[#10151b] text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleDraftWithLLM}
          className="bg-df-accent hover:bg-opacity-90 text-white dark:text-black px-6 py-3 rounded-lg font-bold transition-colors text-sm inline-flex items-center justify-center gap-2 mb-10 shadow-lg"
        >
          <FiFileText size={18} /> Generate Document
        </button>
      </div>
    </div>
  );
};

export default GenerateDoc;
