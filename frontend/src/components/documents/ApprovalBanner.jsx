import React, { useState } from 'react';
import { FiClock, FiCheckCircle, FiXCircle, FiMessageSquare, FiShield } from 'react-icons/fi';
import ApprovalActionModal from './ApprovalActionModal';

const ApprovalBanner = ({ document, currentUser, onRefresh }) => {
  const [action, setAction] = useState(null); // 'approve' | 'reject'
  const [legalAction, setLegalAction] = useState(null);

  // Show only if presales or pending status
  const isPresales = document.doc_type === 'presales';
  const isNda = document.doc_type === 'nda';
  const isPending = document.status.includes('pending');
  
  const wasRejected = (isPresales || isNda) && document.status === 'draft';

  if (!isPresales && !isNda && !isPending && !wasRejected) return null;

  const canApprovePresales = ['division_head', 'super_admin'].includes(currentUser?.role);
  const canApproveLegal = ['legal', 'super_admin'].includes(currentUser?.role);

  return (
    <div className="mt-4 animate-in slide-in-from-top-2">
      {/* Presales Approval */}
      {isPresales && document.status === 'pending_approval' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-800">
            <FiClock className="animate-pulse" size={20} />
            <div>
              <p className="font-bold text-sm">
                {canApprovePresales ? "⏳ This document requires your approval" : "⏳ Awaiting Division Head approval"}
              </p>
              <p className="text-[10px] opacity-75 font-medium uppercase tracking-wider">Presales Document v{document.version_number}</p>
            </div>
          </div>
          
          {canApprovePresales && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setAction('reject')}
                className="px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all shadow-sm"
              >
                Reject
              </button>
              <button 
                onClick={() => setAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      )}

      {/* NDA Legal Review */}
      {isNda && document.status === 'pending_legal_review' && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-purple-800">
            <FiShield className="animate-pulse" size={20} />
            <div>
              <p className="font-bold text-sm">
                {canApproveLegal ? "⚖️ This NDA requires legal review" : "⚖️ Awaiting Legal team review"}
              </p>
              <p className="text-[10px] opacity-75 font-medium uppercase tracking-wider">NDA Document v{document.version_number}</p>
            </div>
          </div>
          
          {canApproveLegal && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setLegalAction('legal-reject')}
                className="px-4 py-2 bg-white border border-purple-100 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-50 transition-all shadow-sm"
              >
                Reject
              </button>
              <button 
                onClick={() => setLegalAction('legal-approve')}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-100"
              >
                Approve
              </button>
            </div>
          )}
        </div>
      )}

      {(document.status === 'approved' || (isNda && document.status === 'pending_final_approval')) && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center space-x-3 text-green-700">
          <FiCheckCircle size={20} />
          <div>
            <p className="font-bold text-sm">✅ Approved — ready to proceed</p>
            <p className="text-[10px] opacity-75 font-medium">Validation completed by designated authority</p>
          </div>
        </div>
      )}

      {wasRejected && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-3 text-red-700">
            <FiXCircle size={20} />
            <div>
              <p className="font-bold text-sm">❌ Rejected — please review and regenerate</p>
              <p className="text-[10px] opacity-75 font-medium">Revisions requested during review process</p>
            </div>
          </div>
          <div className="bg-white/50 p-3 rounded-xl border border-red-50 text-xs text-red-600 italic flex items-start space-x-2">
            <FiMessageSquare className="mt-0.5 shrink-0" />
            <p>Check the activity timeline for detailed rejection comments.</p>
          </div>
        </div>
      )}

      {action && (
        <ApprovalActionModal 
          document={document} 
          action={action} 
          onClose={() => setAction(null)} 
          onSuccess={() => {
            setAction(null);
            onRefresh && onRefresh();
          }}
        />
      )}

      {legalAction && (
        <ApprovalActionModal 
          document={document} 
          action={legalAction} 
          onClose={() => setLegalAction(null)} 
          onSuccess={() => {
            setLegalAction(null);
            onRefresh && onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default ApprovalBanner;
