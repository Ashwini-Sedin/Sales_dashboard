import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiCheckCircle, FiZap, FiFileText, FiLayers, FiShield, FiClipboard, FiInfo } from 'react-icons/fi';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import MinioDocForm from '../components/documents/MinioDocForm';
import DetailedProposalForm from '../components/documents/DetailedProposalForm';
import PresalesForm from '../components/documents/PresalesForm';
import NdaForm from '../components/documents/NdaForm';
import SowForm from '../components/documents/SowForm';
import DocumentVersionHistory from '../components/documents/DocumentVersionHistory';

const GenerateDoc = () => {
  const navigate = useNavigate();
  
  // Search & Lead selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const dropdownRef = useRef(null);

  const [activeModal, setActiveModal] = useState(null);

  const docTypes = [
    {
      id: 'quick_sales',
      title: 'Quick Sales',
      description: 'Fast proposal for early-stage leads',
      icon: <FiZap />,
      color: 'bg-yellow-500',
      enabled: true
    },
    {
      id: 'detailed_proposal',
      title: 'Detailed Proposal',
      description: 'Comprehensive multi-section proposal',
      icon: <FiFileText />,
      color: 'bg-blue-600',
      enabled: true
    },
    {
      id: 'presales',
      title: 'Presales Document',
      description: 'Technical scope and effort estimate',
      icon: <FiLayers />,
      color: 'bg-purple-500',
      enabled: true
    },
    {
      id: 'nda',
      title: 'NDA',
      description: 'Non-disclosure agreement',
      icon: <FiShield />,
      color: 'bg-red-500',
      enabled: true
    },
    {
      id: 'sow',
      title: 'Statement of Work',
      description: 'Full project engagement agreement',
      icon: <FiClipboard />,
      color: 'bg-green-500',
      enabled: true
    }
  ];

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
    setShowDropdown(false);
    toast.success(`Connected to Lead: ${lead.first_name}`);
  };

  return (
    <div className="flex flex-col h-full relative">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl">
        <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generate New Document</h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                AI Engine Powered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => {
                    if (!type.enabled) return;
                    if (!selectedLead) {
                      toast.error('Please select a lead from the top right search bar first.');
                      return;
                    }
                    setActiveModal(type.id);
                  }}
                  className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                    type.enabled 
                      ? "bg-white dark:bg-[#141a21] border-gray-100 dark:border-df-border hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50/10 cursor-pointer" 
                      : "bg-gray-50 dark:bg-[#10151b] border-gray-200 dark:border-[#2a3441] opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${type.color}`}>
                      {type.icon}
                    </div>
                    {!type.enabled && (
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  <h4 className={`text-lg font-bold mb-1 ${type.enabled ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                    {type.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    {type.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex space-x-1">
                      <span className="w-6 h-6 rounded bg-gray-100 dark:bg-[#10151b] flex items-center justify-center text-[10px] font-bold text-gray-400">
                        PPTX
                      </span>
                      <span className="w-6 h-6 rounded bg-gray-100 dark:bg-[#10151b] flex items-center justify-center text-[10px] font-bold text-gray-400">
                        DOCX
                      </span>
                    </div>
                    
                    {type.enabled ? (
                      <button className="flex items-center space-x-1 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                        <span>Generate</span>
                        <FiPlus />
                      </button>
                    ) : (
                      <div className="group/tooltip relative">
                        <FiInfo className="text-gray-400" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                          Module under development
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Section 2: Document History */}
            {selectedLead && (
              <div className="mt-10">
                <DocumentVersionHistory leadId={selectedLead.id} lead={selectedLead} />
              </div>
            )}
          </div>
      </div>

      {/* Modals */}
      {selectedLead && activeModal === 'quick_sales' && (
        <MinioDocForm 
          leadId={selectedLead.id} 
          lead={selectedLead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {selectedLead && activeModal === 'detailed_proposal' && (
        <DetailedProposalForm 
          leadId={selectedLead.id} 
          lead={selectedLead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {selectedLead && activeModal === 'presales' && (
        <PresalesForm 
          leadId={selectedLead.id} 
          lead={selectedLead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {selectedLead && activeModal === 'nda' && (
        <NdaForm 
          leadId={selectedLead.id} 
          lead={selectedLead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {selectedLead && activeModal === 'sow' && (
        <SowForm 
          leadId={selectedLead.id} 
          lead={selectedLead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default GenerateDoc;
