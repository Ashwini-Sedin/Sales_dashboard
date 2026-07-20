import React, { useState } from 'react';
import { 
  FiZap, FiFileText, FiLayers, FiShield, 
  FiClipboard, FiPlus, FiInfo 
} from 'react-icons/fi';
import { useDocuments } from '../../hooks/useDocuments';
import DocumentVersionHistory from './DocumentVersionHistory';
import QuickSalesForm from './QuickSalesForm';
import DetailedProposalForm from './DetailedProposalForm';
import PresalesForm from './PresalesForm';
import NdaForm from './NdaForm';
import SowForm from './SowForm';

const DocumentsPanel = ({ leadId, lead }) => {
  const { isLoading } = useDocuments(leadId);
  const [activeModal, setActiveModal] = useState(null); // 'quick_sales' | 'detailed_proposal'

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Section 1: Generate New Document */}
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
              onClick={() => type.enabled && setActiveModal(type.id)}
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
      </div>

      {/* Section 2: Document History */}
      <div>
        <DocumentVersionHistory leadId={leadId} lead={lead} />
      </div>

      {/* Modals */}
      {activeModal === 'quick_sales' && (
        <QuickSalesForm 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'detailed_proposal' && (
        <DetailedProposalForm 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'presales' && (
        <PresalesForm 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'nda' && (
        <NdaForm 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'sow' && (
        <SowForm 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default DocumentsPanel;
