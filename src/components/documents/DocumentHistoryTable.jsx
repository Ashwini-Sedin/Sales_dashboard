import React from 'react';
import { format } from 'date-fns';
import { 
  FiZap, FiFileText, FiLayers, FiShield, 
  FiClipboard, FiDownload, FiExternalLink, FiFile 
} from 'react-icons/fi';
import { useDocumentDownload } from '../../hooks/useDocuments';

const DocumentHistoryTable = ({ documents, leadId, showLead = false }) => {
  const downloadDocument = useDocumentDownload();

  const getDocTypeInfo = (type) => {
    switch (type) {
      case 'quick_sales':
        return { label: 'Quick Sales', icon: <FiZap className="text-yellow-500" /> };
      case 'detailed_proposal':
        return { label: 'Detailed Proposal', icon: <FiFileText className="text-blue-500" /> };
      case 'presales':
        return { label: 'Presales', icon: <FiLayers className="text-purple-500" /> };
      case 'nda':
        return { label: 'NDA', icon: <FiShield className="text-red-500" /> };
      case 'sow':
        return { label: 'SOW', icon: <FiClipboard className="text-green-500" /> };
      default:
        return { label: type, icon: <FiFile className="text-gray-500" /> };
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-medium ";
    switch (status) {
      case 'draft':
        return <span className={base + "bg-gray-100 text-gray-600"}>Draft</span>;
      case 'pending_approval':
      case 'pending_manager_review':
        return <span className={base + "bg-yellow-100 text-yellow-700"}>Pending Review</span>;
      case 'pending_legal_review':
      case 'pending_final_approval':
        return <span className={base + "bg-orange-100 text-orange-700"}>In Approval</span>;
      case 'approved':
        return <span className={base + "bg-green-100 text-green-700"}>Approved</span>;
      case 'sent_for_signature':
        return <span className={base + "bg-blue-100 text-blue-700"}>Sent for Signature</span>;
      case 'signed':
        return <span className={base + "bg-emerald-100 text-emerald-700"}>Signed</span>;
      case 'archived':
        return <span className={base + "bg-gray-100 text-gray-400"}>Archived</span>;
      default:
        return <span className={base + "bg-gray-100 text-gray-600"}>{status}</span>;
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-df-text bg-white dark:bg-df-card rounded-lg border border-dashed border-gray-300 dark:border-df-border">
        <FiFile size={48} className="mb-2" />
        <p>No documents generated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-df-card border border-gray-200 dark:border-df-border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-df-border">
          <thead className="bg-gray-50 dark:bg-[#151b23] sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Type</th>
              {showLead && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Lead / Company</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Format</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-df-text uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-df-card divide-y divide-gray-200 dark:divide-df-border">
            {documents.map((doc, idx) => {
              const { label, icon } = getDocTypeInfo(doc.doc_type);
              return (
                <tr key={doc.id} className={idx % 2 === 0 ? "bg-white dark:bg-df-card" : "bg-gray-50 dark:bg-[#12181f]"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-df-textlight">{label}</span>
                    </div>
                  </td>
                  {showLead && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-df-textlight">{doc.lead_company_name}</div>
                      <div className="text-[10px] text-gray-400 dark:text-df-text font-mono">{doc.lead_id.slice(0, 8)}...</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#151b23] text-gray-700 dark:text-df-text text-xs font-mono">
                      v{doc.version_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.format === 'pptx' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {doc.format.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-df-text">
                    {format(new Date(doc.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => downloadDocument(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-df-accent transition-colors"
                        title="Download"
                      >
                        <FiDownload />
                      </button>
                      {doc.sharepoint_url && (
                        <a 
                          href={doc.sharepoint_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Open in SharePoint"
                        >
                          <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentHistoryTable;
