import React, { useState, useEffect } from 'react';
import { useLeadsList, useChangeStage } from '../../hooks/useLeads';
import LeadsTable from './LeadsTable';
import LeadsKanban from './LeadsKanban';
import CreateLeadModal from './CreateLeadModal';
import { FiSearch, FiFilter, FiList, FiTrello, FiPlus } from 'react-icons/fi';

// Hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const LeadsList = () => {
  const [view, setView] = useState('table'); // 'table' or 'kanban'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');

  const filters = {
    search: debouncedSearch,
    status: statusFilter,
    division: divisionFilter,
  };

  // Remove empty filters
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  const { data: leads, isLoading } = useLeadsList(filters);
  const changeStageMutation = useChangeStage();

  const handleStageChange = ({ id, stage }) => {
    changeStageMutation.mutate({ id, stage });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all your incoming leads.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <FiPlus /> New Lead
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Proposal">Proposal</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Closed Won">Closed Won</option>
              <option value="Closed Lost">Closed Lost</option>
            </select>
            
            <select 
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">All Divisions</option>
              <option value="Enterprise">Enterprise</option>
              <option value="SMB">SMB</option>
              <option value="Mid-Market">Mid-Market</option>
            </select>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setView('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FiList /> Table
          </button>
          <button 
            onClick={() => setView('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FiTrello /> Kanban
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'table' ? (
          <LeadsTable leads={leads} isLoading={isLoading} />
        ) : (
          <LeadsKanban leads={leads} isLoading={isLoading} onChangeStage={handleStageChange} />
        )}
      </div>

      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default LeadsList;
