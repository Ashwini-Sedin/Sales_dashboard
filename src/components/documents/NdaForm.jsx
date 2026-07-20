import React, { useState, useContext } from 'react';
import { 
  FiArrowRight, FiRepeat, FiUsers, 
  FiPlus, FiTrash2, FiEye, FiEyeOff, FiLock, FiCheck, FiZap, FiFileText
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { useNdaClauses } from '../../hooks/useDocuments';

const NdaForm = ({ leadId, lead, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [ndaType, setNdaType] = useState('unilateral');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState({});

  const [formData, setFormData] = useState({
    client_legal_name: lead?.company_name || '',
    client_address: '',
    client_signatory_name: `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim(),
    client_signatory_title: '',
    company_signatory_user_id: '',
    effective_date: new Date().toISOString().split('T')[0],
    purpose_of_disclosure: '',
    term_years: 2,
    additional_parties: [],
    custom_clause_ids: []
  });

  const { data: clauses } = useNdaClauses(user?.division_id);
  
  const { data: signatories } = useQuery({
    queryKey: ['signatories', user?.division_id],
    queryFn: async () => {
      const res = await api.get('/api/users', { 
        params: { role: ['division_head', 'sales_manager', 'admin'] } 
      });
      return res.data;
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleClause = (clause) => {
    if (clause.is_default) return; // Cannot toggle default
    
    setFormData(prev => {
      const ids = prev.custom_clause_ids.includes(clause.id)
        ? prev.custom_clause_ids.filter(id => id !== clause.id)
        : [...prev.custom_clause_ids, clause.id];
      return { ...prev, custom_clause_ids: ids };
    });
  };

  const togglePreview = (id) => {
    setExpandedClauses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addParty = () => {
    setFormData(prev => ({
      ...prev,
      additional_parties: [...prev.additional_parties, { name: '', designation: '', email: '', company: '' }]
    }));
  };

  const removeParty = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_parties: prev.additional_parties.filter((_, i) => i !== index)
    }));
  };

  const handlePartyChange = (index, field, value) => {
    const updated = [...formData.additional_parties];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, additional_parties: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        lead_id: leadId,
        dynamic_inputs: {
          ...formData,
          nda_type: ndaType,
          term_years: parseInt(formData.term_years),
          custom_clause_ids: formData.custom_clause_ids
        }
      };
      await api.post('/api/documents/nda/generate', payload);
      toast.success('NDA generation queued!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to start NDA generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions = [
    { id: 'unilateral', title: 'Unilateral', desc: 'One party discloses to another', icon: <FiArrowRight /> },
    { id: 'mutual', title: 'Mutual', desc: 'Both parties share confidential info', icon: <FiRepeat /> },
    { id: 'multilateral', title: 'Multilateral', desc: 'Three or more parties involved', icon: <FiUsers /> }
  ];

  const clauseLabels = {
    confidentiality: "Confidentiality Obligations",
    exclusions: "Exclusions from Confidentiality",
    obligations: "Obligations of Receiving Party",
    term: "Term and Duration",
    governing_law: "Governing Law",
    dispute_resolution: "Dispute Resolution",
    ip: "Intellectual Property",
    entire_agreement: "Entire Agreement",
    severability: "Severability",
    waiver: "Waiver"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[640px] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-df-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Generate NDA</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Standard legal non-disclosure agreement</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <FiTrash2 className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          {/* Section 1: NDA Type */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Agreement Type</h3>
            <div className="grid grid-cols-3 gap-4">
              {typeOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setNdaType(opt.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${
                    ndaType === opt.id 
                      ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50' 
                      : 'border-gray-100 dark:border-df-border hover:border-gray-200 dark:border-[#2a3441] bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    ndaType === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-[#10151b] text-gray-400 group-hover:bg-gray-100'
                  }`}>
                    {opt.icon}
                  </div>
                  <h4 className={`font-bold text-sm ${ndaType === opt.id ? 'text-blue-900' : 'text-gray-900 dark:text-white'}`}>{opt.title}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Party Details */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Party Details</h3>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Company Signatory</span>
                <select
                  required
                  value={formData.company_signatory_user_id}
                  onChange={(e) => handleInputChange('company_signatory_user_id', e.target.value)}
                  className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm font-medium p-3"
                >
                  <option value="">Select Signatory...</option>
                  {signatories?.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Client Legal Name</span>
                  <input
                    type="text"
                    required
                    value={formData.client_legal_name}
                    onChange={(e) => handleInputChange('client_legal_name', e.target.value)}
                    placeholder="Full legal entity name"
                    className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Client Signatory Name</span>
                  <input
                    type="text"
                    required
                    value={formData.client_signatory_name}
                    onChange={(e) => handleInputChange('client_signatory_name', e.target.value)}
                    placeholder="Full name of authorized signatory"
                    className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Client Signatory Title</span>
                  <input
                    type="text"
                    required
                    value={formData.client_signatory_title}
                    onChange={(e) => handleInputChange('client_signatory_title', e.target.value)}
                    placeholder="e.g. Chief Executive Officer"
                    className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Client Address</span>
                  <textarea
                    required
                    rows="1"
                    value={formData.client_address}
                    onChange={(e) => handleInputChange('client_address', e.target.value)}
                    placeholder="Registered business address"
                    className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                  />
                </label>
              </div>
            </div>

            {ndaType === 'multilateral' && (
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Additional Parties</h4>
                  <button type="button" onClick={addParty} className="flex items-center space-x-1 text-blue-600 text-xs font-bold hover:text-blue-700">
                    <FiPlus /> <span>Add Party</span>
                  </button>
                </div>
                {formData.additional_parties.map((party, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-[#10151b] rounded-2xl border border-gray-100 dark:border-df-border space-y-3 relative animate-in slide-in-from-right-2">
                    <button onClick={() => removeParty(idx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">
                      <FiTrash2 />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Party Company" 
                        required 
                        value={party.company} 
                        onChange={(e) => handlePartyChange(idx, 'company', e.target.value)}
                        className="rounded-xl border-gray-100 dark:border-df-border text-xs" 
                      />
                      <input 
                        placeholder="Signatory Name" 
                        required 
                        value={party.name} 
                        onChange={(e) => handlePartyChange(idx, 'name', e.target.value)}
                        className="rounded-xl border-gray-100 dark:border-df-border text-xs" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        placeholder="Designation" 
                        required 
                        value={party.designation} 
                        onChange={(e) => handlePartyChange(idx, 'designation', e.target.value)}
                        className="rounded-xl border-gray-100 dark:border-df-border text-xs" 
                      />
                      <input 
                        placeholder="Email" 
                        type="email" 
                        required 
                        value={party.email} 
                        onChange={(e) => handlePartyChange(idx, 'email', e.target.value)}
                        className="rounded-xl border-gray-100 dark:border-df-border text-xs" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Agreement Details */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Agreement Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <label className="block">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Effective Date</span>
                <input
                  type="date"
                  required
                  value={formData.effective_date}
                  onChange={(e) => handleInputChange('effective_date', e.target.value)}
                  className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Term (Years)</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={formData.term_years}
                  onChange={(e) => handleInputChange('term_years', e.target.value)}
                  className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Purpose of Disclosure</span>
              <textarea
                required
                rows="3"
                value={formData.purpose_of_disclosure}
                onChange={(e) => handleInputChange('purpose_of_disclosure', e.target.value)}
                placeholder="Describe the purpose for sharing confidential information..."
                className="mt-1 block w-full rounded-2xl border-gray-100 dark:border-df-border bg-gray-50 dark:bg-[#10151b] focus:bg-white focus:ring-blue-500 transition-all text-sm p-3"
              />
            </label>
          </div>

          {/* Section 4: Clause Selection */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Select Clauses</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 uppercase tracking-widest">Default clauses are pre-selected. Customize as needed.</p>
            </div>
            
            <div className="divide-y divide-gray-50 border border-gray-100 dark:border-df-border rounded-3xl overflow-hidden">
              {clauses?.map(clause => {
                const isSelected = clause.is_default || formData.custom_clause_ids.includes(clause.id);
                const isExpanded = expandedClauses[clause.id];
                
                return (
                  <div key={clause.id} className="bg-white">
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:bg-[#10151b] transition-colors">
                      <div className="flex items-center space-x-4">
                        <div 
                          onClick={() => toggleClause(clause)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white dark:bg-[#141a21] border-gray-200 dark:border-[#2a3441] dark:border-[#2a3441]'
                          }`}
                        >
                          {clause.is_default ? <FiLock size={12} /> : (isSelected && <FiCheck size={14} />)}
                        </div>
                        <span className={`text-sm font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                          {clauseLabels[clause.clause_type] || clause.clause_type.replace('_', ' ')}
                        </span>
                        {clause.is_default && <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Standard</span>}
                      </div>
                      <button 
                        type="button"
                        onClick={() => togglePreview(clause.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {isExpanded ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="px-14 pb-4 animate-in slide-in-from-top-2">
                        <div className="p-4 bg-gray-50 dark:bg-[#10151b] rounded-2xl border border-gray-100 dark:border-df-border text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed max-h-32 overflow-y-auto">
                          {clause.clause_text}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Live Preview */}
          <div className="border-t border-gray-100 dark:border-df-border pt-8">
            <button
              type="button"
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all"
            >
              <div className="flex items-center space-x-3">
                <FiZap className="text-yellow-400" />
                <span className="text-sm font-black uppercase tracking-widest">Preview NDA Structure</span>
              </div>
              <div className={`transition-transform duration-300 ${isPreviewExpanded ? 'rotate-180' : ''}`}>
                <FiPlus />
              </div>
            </button>

            {isPreviewExpanded && (
              <div className="mt-4 p-8 bg-gray-50 dark:bg-[#10151b] rounded-3xl border-2 border-dashed border-gray-200 dark:border-[#2a3441] space-y-6 animate-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{ndaType.toUpperCase()} NON-DISCLOSURE AGREEMENT</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">This agreement is entered into as of <b>{formData.effective_date}</b></p>
                </div>

                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 dark:border-df-border">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Party A</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{user?.division?.name}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 dark:border-df-border">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Party B</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{formData.client_legal_name || '...'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Selected Clauses</p>
                  <div className="flex flex-wrap gap-2">
                    {clauses?.filter(c => c.is_default || formData.custom_clause_ids.includes(c.id)).map((c, i) => (
                      <span key={c.id} className="px-3 py-1 bg-white border border-gray-100 dark:border-df-border rounded-lg text-[9px] font-bold text-gray-500 dark:text-gray-400">
                        {i + 1}. {c.clause_type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center space-x-2 text-[10px] text-gray-400 font-bold italic">
                  <FiFileText />
                  <span>Signature blocks will be generated automatically for all parties.</span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 dark:border-df-border flex items-center justify-between bg-white">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 dark:text-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.company_signatory_user_id}
            className="flex items-center space-x-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all active:scale-95 disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <FiZap />
                <span>Generate NDA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NdaForm;
