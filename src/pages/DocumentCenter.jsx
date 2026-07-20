import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { useDocumentDownload } from '../hooks/useDocuments';

const DocumentCenter = () => {
  const navigate = useNavigate();
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const downloadDocument = useDocumentDownload();

  const { data, isLoading } = useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => {
      const res = await api.get('/api/documents/');
      return res.data;
    },
    refetchInterval: 10000
  });

  const handleGenerateDoc = () => {
    navigate('/generate-doc');
  };

  const handleDownload = async (documentId) => {
    try {
      await downloadDocument(documentId);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert(error?.response?.data?.detail || 'Unable to download this document.');
    }
  };

  const documents = data?.documents || [];

  const filteredDocs = documents.filter((doc) => {
    if (activeTypeFilter === 'All Types') return true;
    return doc.format?.toUpperCase() === activeTypeFilter;
  });

  const getTypeStyle = (type) => {
    if (type === 'PPTX') return 'text-amber-500 font-bold';
    if (type === 'PDF') return 'text-rose-500 font-bold';
    if (type === 'DOCX') return 'text-sky-500 font-bold';
    return 'text-slate-500';
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'draft' || s === 'new') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#e5faef] dark:bg-[#0ebf99]/10 text-[#0ebf99]">
          Draft
        </span>
      );
    }
    if (s === 'pending_approval' || s === 'proposal') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#fef3c7] dark:bg-[#d97706]/10 text-[#d97706]">
          Pending
        </span>
      );
    }
    if (s === 'approved') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#dbeafe] dark:bg-[#2563eb]/10 text-[#2563eb]">
          Approved
        </span>
      );
    }
    if (s === 'signed' || s === 'won') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#e5faef] dark:bg-[#0ebf99]/10 text-[#0ebf99]">
          Signed
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
        {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">All Documents</h1>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {['All Types', 'PPTX', 'DOCX', 'PDF'].map((type) => {
            const isSelected = activeTypeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                  isSelected
                    ? 'border-[#0ebf99] text-[#0ebf99] bg-[#0ebf99]/5 dark:bg-[#0ebf99]/10'
                    : 'border-slate-200 dark:border-[#2a3441] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-[#2a3441]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleGenerateDoc}
          className="bg-[#0ebf99] hover:bg-[#0ca887] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-sm text-sm"
        >
          Generate Document
        </button>
      </div>

      {/* Document History Table */}
      <div className="bg-white dark:bg-[#141a21] rounded-xl border border-slate-100 dark:border-df-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] dark:bg-[#10151b] border-b border-slate-100 dark:border-[#2a3441]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  By
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2a3441]">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium">
                    Loading documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium">
                    No documents found.
                  </td>
                </tr>
              ) : filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-[#10151b] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800 dark:text-white">{doc.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs ${getTypeStyle(doc.format?.toUpperCase())}`}>
                      {doc.format?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                    v{doc.version_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {doc.creator_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="mr-4 text-[#0ebf99] hover:text-teal-400 transition-colors text-xs"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => navigate(`/leads/${doc.lead_id}?tab=documents`)}
                      className="flex items-center gap-1 text-[#0ebf99] hover:text-teal-400 transition-colors text-xs"
                    >
                      View <span className="text-[10px]">↗</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentCenter;
