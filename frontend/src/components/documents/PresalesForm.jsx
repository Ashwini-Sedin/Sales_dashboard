import React, { useState } from 'react';
import { 
  FiFileText, FiLayers, FiClock, FiAlertTriangle, 
  FiCode, FiCheckCircle, FiPlus, FiTrash2, 
  FiChevronLeft, FiChevronRight, FiZap 
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import toast from 'react-hot-toast';

const PresalesForm = ({ leadId, lead, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    executive_overview: '',
    client_background: '',
    problem_statement: '',
    solution_overview: '',
    commercial_model: 'fixed',
    scope_items: [{ item: '', in_scope: true }],
    assumptions: [''],
    effort_rows: [{ phase: '', role: '', days: 1, rate_per_day: 0 }],
    risks: [{ risk: '', impact: 'Medium', probability: 'Medium', mitigation: '' }],
    technology_ids: []
  });

  const { data: techLibrary } = useQuery({
    queryKey: ['tech-library'],
    queryFn: async () => {
      const res = await api.get('/api/tech-library');
      return res.data;
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDynamicChange = (field, index, subField, value) => {
    const updated = [...formData[field]];
    updated[index][subField] = value;
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

  const toggleTech = (id) => {
    setFormData(prev => {
      const ids = prev.technology_ids.includes(id)
        ? prev.technology_ids.filter(tid => tid !== id)
        : [...prev.technology_ids, id];
      return { ...prev, technology_ids: ids };
    });
  };

  const totalDays = formData.effort_rows.reduce((sum, row) => sum + (Number(row.days) || 0), 0);
  const totalCost = formData.effort_rows.reduce((sum, row) => sum + (Number(row.days) * Number(row.rate_per_day) || 0), 0);

  const validateStep = () => {
    if (currentStep === 1) {
      return formData.executive_overview && formData.client_background && formData.problem_statement && formData.solution_overview;
    }
    if (currentStep === 2) {
      return formData.scope_items.some(i => i.item.trim() !== '');
    }
    if (currentStep === 3) {
      return formData.effort_rows.every(r => r.phase && r.role && r.days > 0);
    }
    if (currentStep === 4) {
      return formData.risks.every(r => r.risk && r.impact && r.probability);
    }
    if (currentStep === 5) {
      return formData.technology_ids.length > 0;
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
          scope_items: formData.scope_items.filter(i => i.item.trim()),
          assumptions: formData.assumptions.filter(a => a.trim()),
          effort_rows: formData.effort_rows.map(r => ({ ...r, days: Number(r.days), rate_per_day: Number(r.rate_per_day) })),
          risks: formData.risks.filter(r => r.risk.trim())
        }
      };
      await api.post('/api/documents/presales/generate', payload);
      toast.success('Presales Document generation queued!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to start document generation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { n: 1, label: 'Overview', icon: FiFileText },
    { n: 2, label: 'Scope', icon: FiLayers },
    { n: 3, label: 'Effort', icon: FiClock },
    { n: 4, label: 'Risks', icon: FiAlertTriangle },
    { n: 5, label: 'Tech Stack', icon: FiCode },
    { n: 6, label: 'Review', icon: FiCheckCircle }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Stepper */}
        <div className="p-8 border-b border-gray-100 dark:border-df-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Presales Document Generator</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Step {currentStep} of 6 — {steps[currentStep-1].label}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <FiTrash2 className="text-gray-400" />
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
                      : 'bg-white border-2 border-gray-100 dark:border-df-border text-gray-300'
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {currentStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Executive Overview</label>
                  <textarea 
                    value={formData.executive_overview}
                    onChange={(e) => handleInputChange('executive_overview', e.target.value)}
                    className="w-full rounded-2xl border-gray-200 dark:border-[#2a3441] focus:ring-blue-500 focus:border-blue-500 p-4"
                    rows="4"
                    placeholder="High-level overview of the engagement..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Client Background</label>
                  <textarea 
                    value={formData.client_background}
                    onChange={(e) => handleInputChange('client_background', e.target.value)}
                    className="w-full rounded-2xl border-gray-200 dark:border-[#2a3441] focus:ring-blue-500 focus:border-blue-500 p-4"
                    rows="3"
                    placeholder="Brief description of the client..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Problem Statement</label>
                  <textarea 
                    value={formData.problem_statement}
                    onChange={(e) => handleInputChange('problem_statement', e.target.value)}
                    className="w-full rounded-2xl border-gray-200 dark:border-[#2a3441] focus:ring-blue-500 focus:border-blue-500 p-4"
                    rows="3"
                    placeholder="Key business problems to solve..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Solution Overview</label>
                  <textarea 
                    value={formData.solution_overview}
                    onChange={(e) => handleInputChange('solution_overview', e.target.value)}
                    className="w-full rounded-2xl border-gray-200 dark:border-[#2a3441] focus:ring-blue-500 focus:border-blue-500 p-4"
                    rows="4"
                    placeholder="Proposed technical solution..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Commercial Model</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['fixed', 't_and_m', 'retainer'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleInputChange('commercial_model', mode)}
                        className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                          formData.commercial_model === mode 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-gray-100 dark:border-df-border bg-white text-gray-400 hover:border-gray-200 dark:border-[#2a3441]'
                        }`}
                      >
                        {mode === 't_and_m' ? 'Time & Materials' : mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Scope of Work</h3>
                <div className="space-y-3">
                  {formData.scope_items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 animate-in slide-in-from-left-2">
                      <input 
                        type="text"
                        value={item.item}
                        onChange={(e) => handleDynamicChange('scope_items', idx, 'item', e.target.value)}
                        placeholder="Scope item description..."
                        className="flex-1 rounded-xl border-gray-200 dark:border-[#2a3441]"
                      />
                      <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-df-border bg-white shadow-sm">
                        <button 
                          onClick={() => handleDynamicChange('scope_items', idx, 'in_scope', true)}
                          className={`px-3 py-2 text-[10px] font-black uppercase tracking-tighter ${item.in_scope ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          In Scope
                        </button>
                        <button 
                          onClick={() => handleDynamicChange('scope_items', idx, 'in_scope', false)}
                          className={`px-3 py-2 text-[10px] font-black uppercase tracking-tighter ${!item.in_scope ? 'bg-red-500 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          Out Scope
                        </button>
                      </div>
                      <button onClick={() => removeItem('scope_items', idx)} className="p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('scope_items', { item: '', in_scope: true })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 pt-2"
                  >
                    <FiPlus /> <span>Add Scope Item</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assumptions</h3>
                <div className="space-y-3">
                  {formData.assumptions.map((ass, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <input 
                        type="text"
                        value={ass}
                        onChange={(e) => {
                          const updated = [...formData.assumptions];
                          updated[idx] = e.target.value;
                          handleInputChange('assumptions', updated);
                        }}
                        placeholder="e.g. Client will provide access to systems"
                        className="flex-1 rounded-xl border-gray-200 dark:border-[#2a3441]"
                      />
                      <button onClick={() => removeItem('assumptions', idx)} className="p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addItem('assumptions', '')}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 pt-2"
                  >
                    <FiPlus /> <span>Add Assumption</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <FiZap />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Effort Estimation</h4>
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Model: {formData.commercial_model.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-900">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 font-bold">{totalDays} Total Days</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 dark:border-df-border overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#10151b] border-b border-gray-100 dark:border-df-border">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4 text-left">Phase</th>
                      <th className="px-6 py-4 text-left">Role</th>
                      <th className="px-6 py-4 text-left">Days</th>
                      <th className="px-6 py-4 text-left">Rate/Day</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {formData.effort_rows.map((row, idx) => (
                      <tr key={idx} className="group hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={row.phase}
                            onChange={(e) => handleDynamicChange('effort_rows', idx, 'phase', e.target.value)}
                            placeholder="e.g. Discovery"
                            className="w-full border-transparent bg-transparent focus:ring-0 focus:border-blue-500 rounded-lg"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text" 
                            value={row.role}
                            onChange={(e) => handleDynamicChange('effort_rows', idx, 'role', e.target.value)}
                            placeholder="e.g. Architect"
                            className="w-full border-transparent bg-transparent focus:ring-0 focus:border-blue-500 rounded-lg"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            value={row.days}
                            onChange={(e) => handleDynamicChange('effort_rows', idx, 'days', e.target.value)}
                            className="w-20 border-transparent bg-transparent focus:ring-0 focus:border-blue-500 rounded-lg"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-400 font-bold">$</span>
                            <input 
                              type="number" 
                              value={row.rate_per_day}
                              onChange={(e) => handleDynamicChange('effort_rows', idx, 'rate_per_day', e.target.value)}
                              className="w-24 border-transparent bg-transparent focus:ring-0 focus:border-blue-500 rounded-lg"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removeItem('effort_rows', idx)} className="p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button 
                onClick={() => addItem('effort_rows', { phase: '', role: '', days: 1, rate_per_day: 0 })}
                className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                <FiPlus /> <span>Add Effort Row</span>
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex items-center space-x-4 mb-4">
                <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm">
                  🔴 {formData.risks.filter(r => r.impact === 'High').length} High
                </div>
                <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm">
                  🟡 {formData.risks.filter(r => r.impact === 'Medium').length} Medium
                </div>
                <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-sm">
                  🟢 {formData.risks.filter(r => r.impact === 'Low').length} Low
                </div>
              </div>

              <div className="space-y-4">
                {formData.risks.map((risk, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 dark:border-df-border shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Risk Description</label>
                          <input 
                            type="text"
                            value={risk.risk}
                            onChange={(e) => handleDynamicChange('risks', idx, 'risk', e.target.value)}
                            placeholder="e.g. Delayed client feedback"
                            className="w-full rounded-xl border-gray-200 dark:border-[#2a3441]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Impact</label>
                            <select 
                              value={risk.impact}
                              onChange={(e) => handleDynamicChange('risks', idx, 'impact', e.target.value)}
                              className="w-full rounded-xl border-gray-200 dark:border-[#2a3441]"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Probability</label>
                            <select 
                              value={risk.probability}
                              onChange={(e) => handleDynamicChange('risks', idx, 'probability', e.target.value)}
                              className="w-full rounded-xl border-gray-200 dark:border-[#2a3441]"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeItem('risks', idx)} className="ml-4 p-2 text-gray-300 hover:text-red-500">
                        <FiTrash2 />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Mitigation Plan</label>
                      <textarea 
                        value={risk.mitigation}
                        onChange={(e) => handleDynamicChange('risks', idx, 'mitigation', e.target.value)}
                        rows="2"
                        placeholder="How will we address this risk?"
                        className="w-full rounded-xl border-gray-200 dark:border-[#2a3441]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => addItem('risks', { risk: '', impact: 'Medium', probability: 'Medium', mitigation: '' })}
                className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                <FiPlus /> <span>Add Risk</span>
              </button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="max-w-5xl mx-auto space-y-8">
              {['frontend', 'backend', 'cloud', 'database', 'devops', 'other'].map(category => {
                const techs = techLibrary?.filter(t => t.category === category) || [];
                if (techs.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{category}</h3>
                    <div className="flex flex-wrap gap-3">
                      {techs.map(tech => (
                        <button
                          key={tech.id}
                          onClick={() => toggleTech(tech.id)}
                          className={`px-6 py-2.5 rounded-full border-2 font-bold transition-all duration-200 ${
                            formData.technology_ids.includes(tech.id)
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                              : 'bg-white border-gray-100 dark:border-df-border text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white'
                          }`}
                        >
                          {tech.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-full shadow-2xl z-20">
                {formData.technology_ids.length} technologies selected
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="max-w-4xl mx-auto space-y-12 pb-12">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 dark:border-df-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Project Overview</h3>
                    <button onClick={() => setCurrentStep(1)} className="text-blue-600 text-sm font-bold">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Commercial Model</p>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm uppercase tracking-wide">
                        {formData.commercial_model.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Executive Summary</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic line-clamp-3">
                        "{formData.executive_overview}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 dark:border-df-border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Scope & Assumptions</h3>
                    <button onClick={() => setCurrentStep(2)} className="text-blue-600 text-sm font-bold">Edit</button>
                  </div>
                  <div className="flex space-x-4 mb-4">
                    <div className="flex-1 p-3 bg-green-50 rounded-2xl border border-green-100 text-center">
                      <p className="text-xl font-black text-green-600">{formData.scope_items.filter(i => i.in_scope).length}</p>
                      <p className="text-[10px] font-bold text-green-500 uppercase">In Scope</p>
                    </div>
                    <div className="flex-1 p-3 bg-red-50 rounded-2xl border border-red-100 text-center">
                      <p className="text-xl font-black text-red-600">{formData.scope_items.filter(i => !i.in_scope).length}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase">Out Scope</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {formData.assumptions.filter(a => a.trim()).length} Key assumptions defined
                  </p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 dark:border-df-border shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Effort & Commercials</h3>
                    <button onClick={() => setCurrentStep(3)} className="text-blue-600 text-sm font-bold">Edit</button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Resource Days</span>
                      <span className="font-bold text-gray-900 dark:text-white">{totalDays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Estimate</span>
                      <span className="text-xl font-black text-blue-600">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 dark:border-df-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Risks & Technologies</h3>
                  <div className="flex space-x-4">
                    <button onClick={() => setCurrentStep(4)} className="text-blue-600 text-sm font-bold">Risks</button>
                    <button onClick={() => setCurrentStep(5)} className="text-blue-600 text-sm font-bold">Tech</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.technology_ids.map(tid => {
                    const tech = techLibrary?.find(t => t.id === tid);
                    return tech ? (
                      <span key={tid} className="px-3 py-1 bg-gray-100 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold">
                        {tech.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <div className="mt-6 flex space-x-3">
                  {['High', 'Medium', 'Low'].map(imp => {
                    const count = formData.risks.filter(r => r.impact === imp).length;
                    if (count === 0) return null;
                    const colors = { High: 'bg-red-100 text-red-600', Medium: 'bg-amber-100 text-amber-600', Low: 'bg-green-100 text-green-600' };
                    return (
                      <span key={imp} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors[imp]}`}>
                        {count} {imp} Risk
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-8 border-t border-gray-100 dark:border-df-border bg-white flex items-center justify-between">
          <button 
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              currentStep === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50'
            }`}
          >
            <FiChevronLeft /> <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={onClose}
              className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 dark:text-gray-400"
            >
              Cancel
            </button>
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
                    <FiZap />
                    <span>Generate Document</span>
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

export default PresalesForm;
