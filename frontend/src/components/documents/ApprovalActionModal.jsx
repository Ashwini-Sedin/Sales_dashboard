import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiMessageSquare, FiSend } from 'react-icons/fi';
import api from '../../api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const ApprovalActionModal = ({ document, action, onClose, onSuccess }) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'reject' && !comments.trim()) {
      toast.error('Rejection comments are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = `/api/documents/${document.id}/${action}`;
      await api.put(endpoint, { comments });
      
      const successMsg = action.includes('approve') ? 'Document approved successfully' : 'Document rejected';
      toast.success(successMsg);
      queryClient.invalidateQueries(['document-versions', document.lead_id]);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action} document`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApprove = action.includes('approve');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-6 flex items-center space-x-4 ${isApprove ? 'bg-green-600' : 'bg-red-600'} text-white`}>
          <div className="p-3 bg-white/20 rounded-2xl">
            {isApprove ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-black">{isApprove ? 'Approve Document' : 'Reject Document'}</h3>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">v{document.version_number} — {document.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
              <FiMessageSquare className="text-gray-400" />
              <span>{isApprove ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="4"
              className="w-full rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-4 text-sm"
              placeholder={isApprove ? "Add any notes for the team..." : "Please specify why the document is being rejected..."}
              required={!isApprove}
            />
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] flex items-center justify-center space-x-2 px-6 py-3 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                isApprove 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-100' 
                  : 'bg-red-600 hover:bg-red-700 shadow-red-100'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSend />
                  <span>Confirm {isApprove ? 'Approval' : 'Rejection'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalActionModal;
