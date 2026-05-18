import React, { useState, useEffect } from 'react';
import { 
  FiFileText, FiLayers, FiUsers, FiCalendar, 
  FiDollarSign, FiCheckCircle, FiPlus, FiTrash2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiArrowRight, FiGitMerge, FiUser, FiShield,
  FiMinus, FiClipboard, FiInfo
} from 'react-icons/fi';
import api from '../../api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';

const SowForm = ({ leadId, lead, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedPresalesDocId, setLinkedPresalesDocId] = useState('');

  const [formData, setFormData] = useState({
    project_name: `${lead?.company_name || 'Client'} — Project`,
    objectives: ['', ''],
    deliverables: [{ name: '', description: '', acceptance_criteria: '', target_date: '' }],
    out_of_scope: [''],
    methodology: 'agile',
    milestones: [{ name: '', description: '', due_date: '', payment_linked: false }],
    raci_matrix: {
      entries: []
    },
    payments: [{ milestone_name: '', amount: 0, percentage: 0, due_date: '' }],
    ip_ownership: 'client',
    change_control_threshold_days: 5
  });

  // Fetch approved presales docs
  const { data: presalesDocs } = useQuery({
    queryKey: ['presales-docs', leadId],
    queryFn: async () => {
      const res = await api.get(`/api/documents?lead_id=${leadId}&doc_type=presales`);
      return res.data.documents.filter(d => d.status === 'approved');
    },
    enabled: !!leadId
  });

  // Sync RACI matrix with deliverables
  useEffect(() => {
    const newEntries = formData.deliverables.map(d => {
      const existing = formData.raci_matrix.entries.find(e => e.deliverable === d.name);
      return existing || {
        deliverable: d.name,
        responsible: '',
        accountable: '',
        consulted: '',
        informed: ''
      };
    });
    setFormData(prev => ({
      ...prev,
      raci_matrix: { entries: newEntries }
    }));
  }, [formData.deliverables]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDynamicChange = (field, index, subField, value) => {
    const updated = [...formData[field]];
    if (subField) {
      updated[index][subField] = value;
    } else {
      updated[index] = value;
    }
    setFormData(prev => ({ ...prev, [field]: updated }));
  };

  const addItem = (field, template) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], template] }));
  };

  const removeItem = (field, index) => {
    if (formData[field].length > 1) {
      const updated = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: updated }));
    }
  };

  const totalPaymentAmount = formData.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPaymentPercentage = formData.payments.reduce((sum, p) => sum + (Number(p.percentage) || 0), 0);

  const validateStep = () => {
    if (currentStep === 1) {
      return formData.project_name && formData.objectives.some(o => o.trim());
    }
    if (currentStep === 2) {
      return formData.deliverables.every(d => d.name && d.target_date);
    }
    if (currentStep === 4) {
      return formData.milestones.every(m => m.name && m.due_date);
    }
    if (currentStep === 5) {
      return formData.payments.length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        lead_id: leadId,
        dynamic_inputs: {
          ...formData,
          objectives: formData.objectives.filter(o => o.trim()),
          out_of_scope: formData.out_of_scope.filter(s => s.trim()),
          linked_presales_doc_id: linkedPresalesDocId || null
        }
      };
      await api.post('/api/documents/sow/generate', payload);
      toast.success('SOW generation started!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to generate SOW');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: 'Overview', icon: FiFileText },
    { n: 2, label: 'Scope', icon: FiLayers },
    { n: 3, label: 'Team & RACI', icon: FiUsers },
    { n: 4, label: 'Timeline', icon: FiCalendar },
    { n: 5, label: 'Commercials', icon: FiDollarSign },
    { n: 6, label: 'Review', icon: FiCheckCircle }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Statement of Work (SOW)</h2>
              <p className="text-gray-500 font-medium">Step {currentStep} of 6 — {steps[currentStep-1].label}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiMinus className="text-gray-400" />
            </button>
          </div>

          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
            {steps.map(step => (
              <div key={step.n} className="relative z-10 flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep === step.n 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-50 scale-110' 
                    : currentStep > step.n 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white border-2 border-gray-100 text-gray-300'
                }`}>
                  {currentStep > step.n ? <FiCheckCircle /> : <step.icon />}
                </div>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors ${
                  currentStep === step.n ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {currentStep === 1 && (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-1">Link to Presales Document (optional)</label>
                <p className="text-xs text-gray-500 mb-4">Auto-import scope and effort from approved presales document</p>
                <select 
                  className="w-full rounded-xl border-gray-200"
                  value={linkedPresalesDocId}
                  onChange={(e) => setLinkedPresalesDocId(e.target.value)}
                >
                  <option value="">None Selected</option>
                  {presalesDocs?.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
                {linkedPresalesDocId && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-1">
                    <FiCheckCircle className="text-green-500" />
                    <span className="text-xs text-green-700 font-bold">
                      Scope and effort will be imported from {presalesDocs?.find(d => d.id === linkedPresalesDocId)?.title}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Project Name</label>
                <input 
                  type="text"
                  className="w-full rounded-xl border-gray-200 p-4"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="e.g. CRM Implementation Project"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Methodology</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'agile', label: 'Agile', icon: FiRefreshCw, color: 'blue' },
                    { id: 'waterfall', label: 'Waterfall', icon: FiArrowRight, color: 'gray' },
                    { id: 'hybrid', label: 'Hybrid', icon: FiGitMerge, color: 'purple' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleInputChange('methodology', m.id)}
                      className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${
                        formData.methodology === m.id 
                          ? 'border-blue-600 bg-blue-50 text-blue-600' 
                          : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <m.icon className="text-2xl mb-2" />
                      <span className="font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-4">Project Objectives</label>
                <div className="space-y-3">
                  {formData.objectives.map((obj, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input 
                        type="text"
                        className="flex-1 rounded-xl border-gray-200"
                        value={obj}
                        onChange={(e) => handleDynamicChange('objectives', idx, null, e.target.value)}
                        placeholder="e.g. Reduce manual data entry by 80%"
                      />
                      <button onClick={() => removeItem('objectives', idx)} className="p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  {formData.objectives.length < 10 && (
                    <button 
                      onClick={() => addItem('objectives', '')}
                      className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 pt-2"
                    >
                      <FiPlus /> <span>Add Objective</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Project Deliverables</h3>
                <div className="grid grid-cols-1 gap-6">
                  {formData.deliverables.map((d, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative animate-in slide-in-from-bottom-2">
                      <button 
                        onClick={() => removeItem('deliverables', idx)} 
                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500"
                      >
                        <FiTrash2 />
                      </button>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Deliverable Name</label>
                          <input 
                            type="text"
                            className="w-full rounded-xl border-gray-200"
                            value={d.name}
                            onChange={(e) => handleDynamicChange('deliverables', idx, 'name', e.target.value)}
                            placeholder="e.g. User Authentication Module"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Target Date</label>
                          <input 
                            type="date"
                            className="w-full rounded-xl border-gray-200"
                            value={d.target_date}
                            onChange={(e) => handleDynamicChange('deliverables', idx, 'target_date', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Description</label>
                          <textarea 
                            rows="2"
                            className="w-full rounded-xl border-gray-200"
                            value={d.description}
                            onChange={(e) => handleDynamicChange('deliverables', idx, 'description', e.target.value)}
                            placeholder="Detailed description..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Acceptance Criteria</label>
                          <textarea 
                            rows="2"
                            className="w-full rounded-xl border-gray-200"
                            value={d.acceptance_criteria}
                            onChange={(e) => handleDynamicChange('deliverables', idx, 'acceptance_criteria', e.target.value)}
                            placeholder="How will this be accepted?"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('deliverables', { name: '', description: '', acceptance_criteria: '', target_date: '' })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus /> <span>Add Deliverable</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Out of Scope Items</h3>
                <div className="space-y-3">
                  {formData.out_of_scope.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input 
                        type="text"
                        className="flex-1 rounded-xl border-gray-200"
                        value={item}
                        onChange={(e) => handleDynamicChange('out_of_scope', idx, null, e.target.value)}
                        placeholder="e.g. Mobile app development"
                      />
                      <button onClick={() => removeItem('out_of_scope', idx)} className="p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('out_of_scope', '')}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus /> <span>Add Item</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Define Responsibilities</h3>
                <p className="text-sm text-gray-500">RACI: Responsible | Accountable | Consulted | Informed</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Deliverable</th>
                      <th className="px-6 py-4">Responsible (R)</th>
                      <th className="px-6 py-4">Accountable (A)</th>
                      <th className="px-6 py-4">Consulted (C)</th>
                      <th className="px-6 py-4">Informed (I)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.raci_matrix.entries.map((entry, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-700">{entry.deliverable || 'Unnamed Deliverable'}</td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            className="w-full rounded-lg border-gray-100 text-sm focus:ring-green-500 focus:border-green-500"
                            value={entry.responsible}
                            onChange={(e) => {
                              const updated = [...formData.raci_matrix.entries];
                              updated[idx].responsible = e.target.value;
                              handleInputChange('raci_matrix', { entries: updated });
                            }}
                            placeholder="e.g. Lead Developer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            className="w-full rounded-lg border-gray-100 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={entry.accountable}
                            onChange={(e) => {
                              const updated = [...formData.raci_matrix.entries];
                              updated[idx].accountable = e.target.value;
                              handleInputChange('raci_matrix', { entries: updated });
                            }}
                            placeholder="e.g. Project Manager"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            className="w-full rounded-lg border-gray-100 text-sm focus:ring-yellow-500 focus:border-yellow-500"
                            value={entry.consulted}
                            onChange={(e) => {
                              const updated = [...formData.raci_matrix.entries];
                              updated[idx].consulted = e.target.value;
                              handleInputChange('raci_matrix', { entries: updated });
                            }}
                            placeholder="e.g. Solution Architect"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            className="w-full rounded-lg border-gray-100 text-sm focus:ring-gray-500 focus:border-gray-500"
                            value={entry.informed}
                            onChange={(e) => {
                              const updated = [...formData.raci_matrix.entries];
                              updated[idx].informed = e.target.value;
                              handleInputChange('raci_matrix', { entries: updated });
                            }}
                            placeholder="e.g. Division Head"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex space-x-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> <span>Responsible</span></div>
                <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> <span>Accountable</span></div>
                <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> <span>Consulted</span></div>
                <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-gray-400"></span> <span>Informed</span></div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="max-w-4xl mx-auto space-y-12">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Project Milestones</h3>
                <div className="space-y-4">
                  {formData.milestones.map((m, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-in slide-in-from-bottom-2">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 flex items-start justify-between">
                          <div className="flex-1 mr-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Milestone Name</label>
                            <input 
                              type="text"
                              className="w-full rounded-xl border-gray-200"
                              value={m.name}
                              onChange={(e) => handleDynamicChange('milestones', idx, 'name', e.target.value)}
                              placeholder="e.g. Phase 1 Complete"
                            />
                          </div>
                          <button onClick={() => removeItem('milestones', idx)} className="mt-6 p-2 text-gray-300 hover:text-red-500">
                            <FiTrash2 />
                          </button>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Description</label>
                          <input 
                            type="text"
                            className="w-full rounded-xl border-gray-200"
                            value={m.description}
                            onChange={(e) => handleDynamicChange('milestones', idx, 'description', e.target.value)}
                            placeholder="Brief description..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Due Date</label>
                          <input 
                            type="date"
                            className="w-full rounded-xl border-gray-200"
                            value={m.due_date}
                            onChange={(e) => handleDynamicChange('milestones', idx, 'due_date', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Payment Linked</label>
                            <div className="flex items-center space-x-3 mt-2">
                              <button 
                                onClick={() => handleDynamicChange('milestones', idx, 'payment_linked', !m.payment_linked)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${m.payment_linked ? 'bg-amber-500' : 'bg-gray-200'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${m.payment_linked ? 'left-7' : 'left-1'}`}></div>
                              </button>
                              {m.payment_linked && <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-1 rounded">Payment Milestone</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('milestones', { name: '', description: '', due_date: '', payment_linked: false })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus /> <span>Add Milestone</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-12">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Intellectual Property Ownership</h3>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { id: 'client', title: 'Client Owns IP', icon: FiUser, desc: 'Client owns all IP upon full payment' },
                    { id: 'company', title: 'We Retain IP', icon: FiShield, desc: 'Service provider retains all IP' },
                    { id: 'joint', title: 'Joint Ownership', icon: FiUsers, desc: 'Both parties share IP rights' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleInputChange('ip_ownership', opt.id)}
                      className={`p-6 rounded-3xl border-2 text-left transition-all ${
                        formData.ip_ownership === opt.id 
                          ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${formData.ip_ownership === opt.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <opt.icon />
                      </div>
                      <h4 className={`font-bold mb-1 ${formData.ip_ownership === opt.id ? 'text-blue-900' : 'text-gray-900'}`}>{opt.title}</h4>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-12">
                <label className="block text-sm font-bold text-gray-700 mb-2">Change Control Threshold</label>
                <div className="flex items-center space-x-4 max-w-xs">
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      min="1" 
                      max="30"
                      className="w-full rounded-xl border-gray-200 p-4 pr-32 font-bold"
                      value={formData.change_control_threshold_days}
                      onChange={(e) => handleInputChange('change_control_threshold_days', parseInt(e.target.value))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">business days</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Response time for change requests</p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Payment Schedule</h3>
                <div className="space-y-4">
                  {formData.payments.map((p, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative animate-in slide-in-from-bottom-2">
                      <button onClick={() => removeItem('payments', idx)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                      <div className="grid grid-cols-4 gap-6">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Milestone Name</label>
                          <input 
                            type="text"
                            className="w-full rounded-xl border-gray-200"
                            value={p.milestone_name}
                            onChange={(e) => handleDynamicChange('payments', idx, 'milestone_name', e.target.value)}
                            placeholder="e.g. Project Kickoff"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                            <input 
                              type="number"
                              className="w-full rounded-xl border-gray-200 p-4 pl-8 font-bold"
                              value={p.amount}
                              onChange={(e) => handleDynamicChange('payments', idx, 'amount', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Percentage (%)</label>
                          <div className="relative">
                            <input 
                              type="number"
                              className="w-full rounded-xl border-gray-200 p-4 pr-8 font-bold"
                              value={p.percentage}
                              onChange={(e) => handleDynamicChange('payments', idx, 'percentage', e.target.value)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Due Date</label>
                          <input 
                            type="date"
                            className="w-full rounded-xl border-gray-200"
                            value={p.due_date}
                            onChange={(e) => handleDynamicChange('payments', idx, 'due_date', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('payments', { milestone_name: '', amount: 0, percentage: 0, due_date: '' })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus /> <span>Add Payment</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 rounded-3xl p-8 text-white flex items-center justify-between shadow-2xl shadow-gray-200">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Contract Value</p>
                  <p className="text-3xl font-black">${totalPaymentAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Percentage</p>
                  <p className={`text-3xl font-black ${totalPaymentPercentage !== 100 ? 'text-amber-400' : 'text-green-400'}`}>
                    {totalPaymentPercentage}%
                  </p>
                </div>
              </div>
              {totalPaymentPercentage !== 100 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3 animate-pulse">
                  <FiInfo className="text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">
                    ⚠️ Payment percentages should total 100% (currently {totalPaymentPercentage}%)
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
              <div className="grid grid-cols-2 gap-6">
                {/* Overview Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <button onClick={() => setCurrentStep(1)} className="absolute top-6 right-6 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Project Name</p>
                      <p className="text-sm font-bold text-gray-900">{formData.project_name}</p>
                    </div>
                    <div className="flex space-x-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Methodology</p>
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{formData.methodology}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Objectives</p>
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black uppercase">{formData.objectives.filter(o => o.trim()).length} Items</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <button onClick={() => setCurrentStep(2)} className="absolute top-6 right-6 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Scope</h3>
                  <div className="flex space-x-4">
                    <div className="flex-1 p-4 bg-green-50 rounded-2xl text-center">
                      <p className="text-2xl font-black text-green-600">{formData.deliverables.length}</p>
                      <p className="text-[10px] font-bold text-green-500 uppercase">Deliverables</p>
                    </div>
                    <div className="flex-1 p-4 bg-red-50 rounded-2xl text-center">
                      <p className="text-2xl font-black text-red-600">{formData.out_of_scope.filter(o => o.trim()).length}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase">Out of Scope</p>
                    </div>
                  </div>
                </div>

                {/* RACI Preview */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden col-span-2 group">
                  <button onClick={() => setCurrentStep(3)} className="absolute top-6 right-6 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">RACI Matrix</h3>
                  <div className="space-y-3">
                    {formData.raci_matrix.entries.slice(0, 2).map((e, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-bold text-gray-700">{e.deliverable}</span>
                        <div className="flex space-x-2">
                          <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-black">R</span>
                          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">A</span>
                        </div>
                      </div>
                    ))}
                    {formData.raci_matrix.entries.length > 2 && (
                      <p className="text-center text-[10px] font-bold text-gray-400 uppercase pt-2">+{formData.raci_matrix.entries.length - 2} more deliverables</p>
                    )}
                  </div>
                </div>

                {/* Timeline & IP Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <button onClick={() => setCurrentStep(4)} className="absolute top-6 right-6 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Timeline & IP</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Milestones</span>
                      <span className="text-sm font-black">{formData.milestones.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">IP Ownership</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black uppercase">{formData.ip_ownership}</span>
                    </div>
                  </div>
                </div>

                {/* Commercials Card */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <button onClick={() => setCurrentStep(5)} className="absolute top-6 right-6 text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Commercials</h3>
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-blue-600">${totalPaymentAmount.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formData.payments.length} Payment Milestones</p>
                  </div>
                </div>

                {linkedPresalesDocId && (
                  <div className="col-span-2 p-4 bg-blue-600 rounded-2xl flex items-center space-x-3 text-white shadow-xl shadow-blue-100">
                    <FiClipboard />
                    <span className="text-sm font-bold">Linked to: {presalesDocs?.find(d => d.id === linkedPresalesDocId)?.title}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-white flex items-center justify-between">
          <button 
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              currentStep === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FiChevronLeft /> <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <button onClick={onClose} className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600">Cancel</button>
            {currentStep < 6 ? (
              <button 
                onClick={() => validateStep() ? setCurrentStep(prev => prev + 1) : toast.error('Please fill required fields')}
                className="flex items-center space-x-2 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 shadow-xl shadow-gray-200 transition-all active:scale-95"
              >
                <span>Next Step</span> <FiChevronRight />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-3 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95 disabled:bg-blue-300"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiClipboard />
                    <span>Generate SOW</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SowForm;
