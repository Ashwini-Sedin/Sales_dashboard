import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiRefreshCw, FiChevronDown, FiChevronUp, FiDownload, 
  FiExternalLink, FiRotateCcw, FiCheckCircle, FiFile,
  FiFileText, FiPieChart, FiShield, FiBriefcase
} from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../../api';
import { useRestoreDocument } from '../../hooks/useDocuments';
import { useAuth } from '../../context/AuthContext';

const DocumentVersionHistory = ({ leadId, lead }) => {
  const { user } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['document-versions', leadId],
    queryFn: async () => {
      const res = await api.get(`/api/documents/lead/${leadId}/versions`);
      return res.data;
    },
    enabled: !!leadId,
    onSuccess: (data) => {
      // Expand first group by default if none are expanded
      if (Object.keys(expandedGroups).length === 0 && data?.groups?.length > 0) {
        setExpandedGroups({ [data.groups[0].doc_type]: true });
      }
    }
  });

  const restoreMutation = useRestoreDocument();

  const toggleGroup = (docType) => {
    setExpandedGroups(prev => ({
      ...prev,
      [docType]: !prev[docType]
    }));
  };

  const handleRestore = (doc) => {
    if (window.confirm(`Restore v${doc.version_number}? This will create a new version based on this document.`)) {
      restoreMutation.mutate({ documentId: doc.id }, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const getDocTypeIcon = (type) => {
    const icons = {
      quick_sales: { icon: FiBriefcase, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Quick Sales' },
      detailed_proposal: { icon: FiFileText, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Detailed Proposal' },
      presales: { icon: FiPieChart, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Presales' },
      nda: { icon: FiShield, color: 'text-red-500', bg: 'bg-red-50', label: 'NDA' },
      sow: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'SOW' }
    };
    return icons[type] || { icon: FiFile, color: 'text-gray-500', bg: 'bg-gray-50', label: type };
  };

  const getStatusStyles = (status) => {
    const styles = {
      draft: 'bg-gray-100 dark:bg-[#2a3441] text-gray-600 dark:text-gray-300',
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      signed: 'bg-blue-100 text-blue-700',
      archived: 'bg-red-50 text-red-500 border border-red-100',
      sent_for_signature: 'bg-indigo-100 text-indigo-700'
    };
    return styles[status] || 'bg-gray-100 dark:bg-[#2a3441] text-gray-600 dark:text-gray-300';
  };

  const getDocuSignBadge = (status) => {
    if (status === 'not_sent') return null;
    const config = {
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700' },
      viewed: { label: 'Viewed', color: 'bg-amber-100 text-amber-700' },
      partially_signed: { label: 'Partial', color: 'bg-orange-100 text-orange-700' },
      completed: { label: 'Signed ✅', color: 'bg-green-100 text-green-700' },
      declined: { label: 'Declined', color: 'bg-red-100 text-red-700' },
      voided: { label: 'Voided', color: 'bg-gray-100 text-gray-500' }
    };
    const item = config[status] || { label: status, color: 'bg-gray-100 text-gray-500' };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.color}`}>{item.label}</span>;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400 dark:text-gray-500">Loading document history...</div>;

  if (!data?.groups?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-[#10151b] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2a3441]">
        <FiFile size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No documents generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white flex items-center">
          <FiFileText className="mr-2 text-blue-600" />
          Document History
        </h3>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className={`p-2 rounded-lg hover:bg-gray-100 transition-all ${isFetching ? 'animate-spin text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <FiRefreshCw />
        </button>
      </div>

      <div className="space-y-4">
        {data.groups.map(group => {
          const config = getDocTypeIcon(group.doc_type);
          const isExpanded = expandedGroups[group.doc_type];
          const signedVersion = group.versions.find(v => v.signed_s3_key);

          return (
            <div key={group.doc_type} className="bg-white dark:bg-[#141a21] rounded-2xl border border-gray-100 dark:border-df-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Accordion Header */}
              <div 
                onClick={() => toggleGroup(group.doc_type)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#10151b] transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl ${config.bg} ${config.color}`}>
                    <config.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{config.label}</h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{group.versions.length} versions</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase">
                    v{group.latest_version}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusStyles(group.latest_status)}`}>
                    {group.latest_status.replace('_', ' ')}
                  </span>
                  {isExpanded ? <FiChevronUp className="text-gray-400 dark:text-gray-500" /> : <FiChevronDown className="text-gray-400 dark:text-gray-500" />}
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="border-t border-gray-50 dark:border-[#2a3441]">
                  {signedVersion && (
                    <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                      <div className="flex items-center space-x-3 text-green-700">
                        <FiCheckCircle size={18} />
                        <div>
                          <p className="text-xs font-bold">✅ Signed document available — v{signedVersion.version_number}</p>
                          <p className="text-[10px] opacity-75">Signed on {format(new Date(signedVersion.signed_at), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <a 
                        href={`/api/documents/${signedVersion.id}/download?signed=true`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Download Signed PDF
                      </a>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-50 dark:border-[#2a3441]">
                          <th className="px-6 py-3">Version</th>
                          <th className="px-4 py-3">Format</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-center">DocuSign</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-[#2a3441]">
                        {group.versions.map((doc, idx) => (
                          <tr key={doc.id} className={`group hover:bg-gray-50 dark:hover:bg-[#10151b] transition-colors ${doc.status === 'archived' ? 'opacity-60' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-gray-900 dark:text-white dark:text-white bg-gray-100 dark:bg-[#2a3441] px-1.5 py-0.5 rounded text-xs">v{doc.version_number}</span>
                                {idx === 0 && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase">Latest</span>}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`${doc.format === 'pptx' ? 'bg-orange-500' : 'bg-blue-600'} text-white px-1.5 py-0.5 rounded text-[10px] font-bold`}>
                                {doc.format.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusStyles(doc.status)}`}>
                                {doc.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-900 dark:text-white">Team Member</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(doc.created_at), 'dd MMM yyyy')}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {getDocuSignBadge(doc.docusign_status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <a 
                                  href={`/api/documents/${doc.id}/download`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Download Original"
                                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                >
                                  <FiDownload size={16} />
                                </a>
                                {doc.sharepoint_url && (
                                  <a 
                                    href={doc.sharepoint_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View in SharePoint"
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-all"
                                  >
                                    <FiExternalLink size={16} />
                                  </a>
                                )}
                                {doc.status === 'archived' && ['admin', 'division_head', 'sales_manager'].includes(user?.role) && (
                                  <button 
                                    onClick={() => handleRestore(doc)}
                                    title="Restore Version"
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all"
                                  >
                                    <FiRotateCcw size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentVersionHistory;
