import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiZap, FiCheck, FiLoader } from 'react-icons/fi';
import api from '../../api';
import GenerationProgressModal from './GenerationProgressModal';

const QuickSalesForm = ({ leadId, lead, onClose, onSuccess }) => {
  const [format, setFormat] = useState('pptx');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskInfo, setTaskInfo] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      proposed_solution_name: '',
      pricing_range: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Clean up dynamic arrays
      const client_challenges = [data.challenge_1, data.challenge_2, data.challenge_3].filter(Boolean);
      const key_benefits = [data.benefit_1, data.benefit_2, data.benefit_3, data.benefit_4, data.benefit_5].filter(Boolean);

      const payload = {
        lead_id: leadId,
        format: format,
        dynamic_inputs: {
          proposed_solution_name: data.proposed_solution_name,
          pricing_range: data.pricing_range,
          start_date: data.start_date,
          end_date: data.end_date,
          client_challenges,
          key_benefits,
          notes: data.notes || ""
        }
      };

      const response = await api.post('/api/documents/quick-sales/generate', payload);
      setTaskInfo({
        taskId: response.data.task_id,
        documentId: response.data.document_id
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error generating quick sales doc:', error);
      alert('Failed to start generation. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="bg-white dark:bg-[#141a21] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-df-border flex items-center justify-between bg-gray-50 dark:bg-[#10151b] dark:bg-[#10151b]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <FiZap size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generate Quick Sales Document</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Fast Proposal Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[80vh]">
          <div className="p-6 space-y-6">
            {/* Format Selector */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Document Format</label>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setFormat('pptx')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition-all ${
                    format === 'pptx' 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                      : "bg-white dark:bg-[#141a21] border-gray-200 dark:border-[#2a3441] dark:border-[#2a3441] text-gray-500 dark:text-gray-400 hover:border-blue-300"
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span className="font-bold">PPTX (Slide Deck)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('docx')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg border-2 transition-all ${
                    format === 'docx' 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                      : "bg-white dark:bg-[#141a21] border-gray-200 dark:border-[#2a3441] dark:border-[#2a3441] text-gray-500 dark:text-gray-400 hover:border-blue-300"
                  }`}
                >
                  <span className="text-xl">📄</span>
                  <span className="font-bold">DOCX (Word Doc)</span>
                </button>
              </div>
            </div>

            {/* Read-only Lead Context */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-[#10151b] rounded-xl border border-gray-100 dark:border-df-border">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Company</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lead?.company_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Contact</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{lead?.first_name} {lead?.last_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Value</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {lead?.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Division</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Global Sales</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Proposed Solution Name *</label>
                <input
                  {...register('proposed_solution_name', { required: true })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Enterprise CRM Implementation"
                />
                {errors.proposed_solution_name && <span className="text-xs text-red-500">Required</span>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Pricing Range *</label>
                <input
                  {...register('pricing_range', { required: true })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. $50,000 - $75,000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    {...register('start_date', { required: true })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    {...register('end_date', { required: true })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Challenges */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Key Challenges (up to 3)</label>
                <div className="space-y-2">
                  <input
                    {...register('challenge_1', { required: true })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Challenge 1 (Required)"
                  />
                  <input
                    {...register('challenge_2')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Challenge 2 (Optional)"
                  />
                  <input
                    {...register('challenge_3')}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Challenge 3 (Optional)"
                  />
                </div>
              </div>

              {/* Benefits */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Key Benefits (up to 5)</label>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    {...register('benefit_1', { required: true })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Benefit 1 (Required)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      {...register('benefit_2')}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Benefit 2"
                    />
                    <input
                      {...register('benefit_3')}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Benefit 3"
                    />
                    <input
                      {...register('benefit_4')}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Benefit 4"
                    />
                    <input
                      {...register('benefit_5')}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Benefit 5"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Internal Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a3441] dark:bg-[#10151b] dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Additional context for the generation engine..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#10151b] border-t border-gray-100 dark:border-df-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:text-gray-900 dark:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center space-x-2 px-8 py-2.5 rounded-lg font-bold text-white transition-all ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-100"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiCheck />
                  <span>Generate Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickSalesForm;
