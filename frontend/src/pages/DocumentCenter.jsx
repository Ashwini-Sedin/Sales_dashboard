import React, { useState } from 'react';
import { 
  FiFileText, FiSearch, FiFilter, FiDownload, 
  FiTrendingUp, FiCheckCircle, FiClock, FiArchive 
} from 'react-icons/fi';
import { useDocuments } from '../hooks/useDocuments';
import DocumentHistoryTable from '../components/documents/DocumentHistoryTable';

const DocumentCenter = () => {
  // Passing null leadId to useDocuments will fetch all documents now
  const { data, isLoading } = useDocuments(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const stats = [
    { label: 'Total Documents', value: data?.total || 0, icon: <FiFileText />, color: 'bg-blue-500' },
    { label: 'Approved', value: data?.documents?.filter(d => d.status === 'approved').length || 0, icon: <FiCheckCircle />, color: 'bg-green-500' },
    { label: 'In Progress', value: data?.documents?.filter(d => ['draft', 'pending_approval'].includes(d.status)).length || 0, icon: <FiClock />, color: 'bg-yellow-500' },
    { label: 'Archived', value: data?.documents?.filter(d => d.status === 'archived').length || 0, icon: <FiArchive />, color: 'bg-gray-500' }
  ];

  const filteredDocs = data?.documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.lead_company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.doc_type === filterType;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Document Center</h1>
          <p className="text-gray-500 mt-1">Manage and track all generated sales intelligence assets.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
            <FiTrendingUp />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl text-white ${stat.color} shadow-lg shadow-opacity-20`}>
                {stat.icon}
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('quick_sales')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterType === 'quick_sales' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Sales
            </button>
            <button 
              onClick={() => setFilterType('detailed_proposal')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterType === 'detailed_proposal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Proposals
            </button>
          </div>
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <FiFilter />
          </button>
        </div>
      </div>

      {/* Document Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900">Recent Documents</h2>
          <button className="text-sm font-bold text-blue-600 hover:underline">Export Report</button>
        </div>
        <DocumentHistoryTable documents={filteredDocs} showLead={true} />
      </div>
    </div>
  );
};

export default DocumentCenter;
