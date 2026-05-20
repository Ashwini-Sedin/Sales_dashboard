import React, { useState, useContext } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  FiX, FiFileText, FiMessageSquare, FiLayers, 
  FiDollarSign, FiUsers, FiPlus, FiTrash2, 
  FiCheck, FiChevronRight, FiChevronLeft, FiLoader,
  FiBriefcase
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { useCaseStudies } from '../../hooks/useDocuments';
import { AuthContext } from '../../context/AuthContext';
import GenerationProgressModal from './GenerationProgressModal';

const DetailedProposalForm = ({ leadId, lead, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [format, setFormat] = useState('pptx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskInfo, setTaskInfo] = useState(null);

  const { data: teamMembers } = useQuery({
    queryKey: ['users', user?.division_id],
    queryFn: async () => {
      const res = await api.get(`/api/users?division_id=${user?.division_id}`);
      return res.data;
    },
    enabled: !!user?.division_id
  });

  const { data: caseStudies } = useCaseStudies(user?.division_id);

  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState([]);
  const [selectedCaseStudyIds, setSelectedCaseStudyIds] = useState([]);

  const { register, control, handleSubmit, watch, formState: { isValid } } = useForm({
    mode: 'onChange',
    defaultValues: {
      client_background: '',
      client_challenges: '',
      solution_description: '',
      phases: [{ phase_name: '', duration: '', deliverables: '' }],
      pricing_breakdown: [{ item_name: '', quantity: 1, unit_price: 0, discount_percent: 0 }]
    }
  });

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: "phases"
  });

  const { fields: pricingFields, append: appendPricing, remove: removePricing } = useFieldArray({
    control,
    name: "pricing_breakdown"
  });

  const watchPricing = watch("pricing_breakdown");
  const subtotal = watchPricing.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const totalDiscount = watchPricing.reduce((acc, item) => acc + (item.quantity * item.unit_price * (item.discount_percent / 100)), 0);
  const grandTotal = subtotal - totalDiscount;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        lead_id: leadId,
        format: format,
        dynamic_inputs: {
          client_background: data.client_background,
          client_challenges: data.client_challenges,
          solution_description: data.solution_description,
          phases: data.phases.map(p => ({
            ...p,
            deliverables: p.deliverables.split('\n').filter(Boolean)
          })),
          pricing_breakdown: data.pricing_breakdown,
          team_member_ids: selectedTeamMemberIds,
          selected_case_study_ids: selectedCaseStudyIds,
          custom_sections: []
        }
      };

      const response = await api.post('/api/documents/detailed-proposal/generate', payload);
      setTaskInfo({
        taskId: response.data.task_id,
        documentId: response.data.document_id
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error generating detailed proposal:', error);
      const detail = error?.response?.data?.detail;
      const msg = detail
        ? `Generation failed: ${detail}`
        : 'Failed to start generation. Please check your inputs or ensure you have the correct permissions for this lead.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Context', icon: <FiMessageSquare /> },
    { id: 2, label: 'Phases', icon: <FiLayers /> },
    { id: 3, label: 'Pricing', icon: <FiDollarSign /> },
    { id: 4, label: 'Team', icon: <FiUsers /> }
  ];

  if (taskInfo) {
    return (
      <GenerationProgressModal 
        taskId={taskInfo.taskId}
        documentId={taskInfo.documentId}
        leadId={leadId}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#141a21] rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-df-border flex items-center justify-between bg-gray-50 dark:bg-[#10151b] dark:bg-[#10151b]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FiFileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detailed Proposal Wizard</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Step {currentStep} of 4</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setFormat('pptx')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                format === 'pptx' ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-[#141a21] border-gray-200 dark:border-[#2a3441] dark:border-[#2a3441] text-gray-500 dark:text-gray-400"
              }`}
            >
              📊 PPTX
            </button>
            <button
              onClick={() => setFormat('docx')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                format === 'docx' ? "bg-blue-600 border-blue-600 text-white" : "bg-white dark:bg-[#141a21] border-gray-200 dark:border-[#2a3441] dark:border-[#2a3441] text-gray-500 dark:text-gray-400"
              }`}
            >
              📄 DOCX
            </button>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors ml-4">
            <FiX size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 dark:border-df-border">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center space-y-1 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.id 
                      ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                      : currentStep > step.id 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    {currentStep > step.id ? <FiCheck /> : step.icon}
                  </div>
                  <span className={`text-xs font-bold ${currentStep === step.id ? "text-blue-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.id ? "bg-green-500" : "bg-gray-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 overflow-y-auto max-h-[60vh]">
            {/* Step 1: Context */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Client Background *</label>
                    <textarea
                      {...register('client_background', { required: true })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Describe the client's business background, industry position, and current operations..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Client Challenges *</label>
                    <textarea
                      {...register('client_challenges', { required: true })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Detail the core business pain points and operational hurdles they face..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Solution Description *</label>
                    <textarea
                      {...register('solution_description', { required: true })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Explain how your solution addresses the above challenges and the value it brings..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Phases */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Project Implementation Phases</h4>
                  <button
                    type="button"
                    onClick={() => appendPhase({ phase_name: '', duration: '', deliverables: '' })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus />
                    <span>Add Phase</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {phaseFields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-gray-200 dark:border-[#2a3441] rounded-xl relative bg-gray-50 dark:bg-[#10151b] dark:bg-[#10151b]">
                      {phaseFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhase(index)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Phase Name</label>
                          <input
                            {...register(`phases.${index}.phase_name`, { required: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Discovery & Analysis"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Duration</label>
                          <input
                            {...register(`phases.${index}.duration`, { required: true })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 2 weeks"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Deliverables (One per line)</label>
                        <textarea
                          {...register(`phases.${index}.deliverables`, { required: true })}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Project Charter&#10;Architecture Diagram"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">Commercial Proposal</h4>
                  <button
                    type="button"
                    onClick={() => appendPricing({ item_name: '', quantity: 1, unit_price: 0, discount_percent: 0 })}
                    className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    <FiPlus />
                    <span>Add Line Item</span>
                  </button>
                </div>
                
                <div className="border border-gray-200 dark:border-[#2a3441] rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-[#10151b] dark:bg-[#10151b]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase w-20">Qty</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase w-32">Unit Price</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase w-24">Disc %</th>
                        <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase w-32">Total</th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {pricingFields.map((field, index) => {
                        const rowTotal = (watchPricing[index]?.quantity || 0) * (watchPricing[index]?.unit_price || 0) * (1 - (watchPricing[index]?.discount_percent || 0) / 100);
                        return (
                          <tr key={field.id}>
                            <td className="px-4 py-2">
                              <input
                                {...register(`pricing_breakdown.${index}.item_name`, { required: true })}
                                className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 dark:border-[#2a3441] focus:border-blue-500 outline-none rounded"
                                placeholder="Service item..."
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                {...register(`pricing_breakdown.${index}.quantity`, { valueAsNumber: true, required: true })}
                                className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 dark:border-[#2a3441] focus:border-blue-500 outline-none rounded"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-400">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(`pricing_breakdown.${index}.unit_price`, { valueAsNumber: true, required: true })}
                                  className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 dark:border-[#2a3441] focus:border-blue-500 outline-none rounded"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                {...register(`pricing_breakdown.${index}.discount_percent`, { valueAsNumber: true })}
                                className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 dark:border-[#2a3441] focus:border-blue-500 outline-none rounded"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 dark:text-white">
                              ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2">
                              {pricingFields.length > 1 && (
                                <button type="button" onClick={() => removePricing(index)} className="text-red-400 hover:text-red-600">
                                  <FiTrash2 />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Subtotal</span>
                      <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Total Discount</span>
                      <span>-${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-blue-600 border-t border-gray-100 dark:border-df-border pt-2">
                      <span>Grand Total</span>
                      <span>${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Team & Case Studies */}
            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-300">
                {/* Team Selection */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FiUsers />
                    <span>Select Team Members</span>
                  </h4>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {teamMembers?.map(member => {
                      const isSelected = selectedTeamMemberIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => setSelectedTeamMemberIds(prev => 
                            isSelected ? prev.filter(id => id !== member.id) : [...prev, member.id]
                          )}
                          className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-100 dark:border-df-border hover:border-gray-200 dark:border-[#2a3441]"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500 dark:text-gray-400"
                          }`}>
                            {member.first_name[0]}{member.last_name[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{member.role.replace('_', ' ')}</p>
                          </div>
                          {isSelected && <FiCheck className="text-blue-600" />}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 font-medium">
                    {selectedTeamMemberIds.length} members selected for the proposal team
                  </p>
                </div>

                {/* Case Study Selection */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <FiBriefcase />
                    <span>Select Case Studies</span>
                  </h4>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {!caseStudies?.length && <p className="text-sm text-gray-400 italic">No case studies available for your division.</p>}
                    {caseStudies?.map(cs => {
                      const isSelected = selectedCaseStudyIds.includes(cs.id);
                      return (
                        <div
                          key={cs.id}
                          onClick={() => setSelectedCaseStudyIds(prev => 
                            isSelected ? prev.filter(id => id !== cs.id) : [...prev, cs.id]
                          )}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                            isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-100 dark:border-df-border hover:border-gray-200 dark:border-[#2a3441]"
                          }`}
                        >
                          <div className="flex space-x-3 mb-2">
                            {cs.image_url && (
                              <img src={cs.image_url} alt="" className="w-12 h-12 rounded bg-gray-100 object-cover" />
                            )}
                            <div className="flex-1">
                              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{cs.title}</h5>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">
                                  {cs.industry}
                                </span>
                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
                                  {cs.client_name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cs.technology_tags?.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[9px] bg-gray-100 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600 bg-opacity-10 flex items-center justify-center rounded-xl">
                              <div className="bg-blue-600 text-white rounded-full p-1 shadow-lg">
                                <FiCheck size={16} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-400 font-medium">
                    {selectedCaseStudyIds.length} case studies selected
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-[#10151b] border-t border-gray-100 dark:border-df-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center space-x-2 font-bold transition-all ${
                currentStep === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white"
              }`}
            >
              <FiChevronLeft />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!isValid}
                  className={`flex items-center space-x-2 px-8 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all ${
                    !isValid ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                  }`}
                >
                  <span>Next Step</span>
                  <FiChevronRight />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center space-x-2 px-10 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all ${
                    isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-100"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Generating Proposal...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>Generate Full Proposal</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DetailedProposalForm;
