import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_DOCUMENTS = [
  { id: 1, title: 'Quick Sales — TechNova Pvt Ltd', type: 'PPTX', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 2, title: 'NDA — TechNova Pvt Ltd', type: 'PDF', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 3, title: 'Detailed Proposal — TechNova Pvt Ltd', type: 'DOCX', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 4, title: 'Quick Sales — TechNova Pvt Ltd', type: 'PPTX', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 5, title: 'Detailed Proposal — TechNova Pvt Ltd', type: 'DOCX', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 6, title: 'Quick Sales Deck — TechNova Pvt Ltd', type: 'PPTX', version: 'v2', by: 'Arjun Kumar', status: 'Proposal' },
  { id: 7, title: 'Detailed Proposal — Cloud Migration', type: 'DOCX', version: 'v1', by: 'Arjun Kumar', status: 'New' },
  { id: 8, title: 'NDA — TechNova Pvt Ltd (Mutual)', type: 'PDF', version: 'v1', by: 'Deepak Malhotra', status: 'Won' },
  { id: 9, title: 'Presales Assessment — TechNova', type: 'DOCX', version: 'v1', by: 'Suresh Rao', status: 'Won' },
  { id: 10, title: 'SOW — Cloud Migration Programme', type: 'DOCX', version: 'v1', by: 'Suresh Rao', status: 'Contacted' },
];

const DocumentCenter = () => {
  const navigate = useNavigate();
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');

  const handleGenerateDoc = () => {
    navigate('/generate-doc');
  };

  const filteredDocs = MOCK_DOCUMENTS.filter((doc) => {
    if (activeTypeFilter === 'All Types') return true;
    return doc.type === activeTypeFilter;
  });

  const getTypeStyle = (type) => {
    if (type === 'PPTX') return 'text-amber-500 font-bold';
    if (type === 'PDF') return 'text-rose-500 font-bold';
    if (type === 'DOCX') return 'text-sky-500 font-bold';
    return 'text-slate-500';
  };

  const getStatusBadge = (status) => {
    if (status === 'New') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#e5faef] text-[#0ebf99]">
          New
        </span>
      );
    }
    if (status === 'Proposal') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#fef3c7] text-[#d97706]">
          Proposal
        </span>
      );
    }
    if (status === 'Won') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#e5faef] text-[#0ebf99]">
          Won
        </span>
      );
    }
    if (status === 'Contacted') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#f3e8ff] text-[#8b5cf6]">
          Contacted
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">All Documents</h1>
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
                    ? 'border-[#0ebf99] text-[#0ebf99] bg-[#0ebf99]/5'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
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
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[#f8fafc] border-b border-slate-100">
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
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800">{doc.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs ${getTypeStyle(doc.type)}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                    {doc.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {doc.by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={handleGenerateDoc}
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
