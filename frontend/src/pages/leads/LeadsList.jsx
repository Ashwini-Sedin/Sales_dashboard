import React, { useState, useEffect } from 'react';
import { useInfiniteLeadsList, useChangeStage } from '../../hooks/useLeads';
import LeadsTable from './LeadsTable';
import LeadsKanban from './LeadsKanban';
import CreateLeadModal from './CreateLeadModal';
import { FiSearch, FiList, FiTrello, FiPlus } from 'react-icons/fi';

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

  const filters = {
    search: debouncedSearch,
    status: statusFilter,
  };

  // Remove empty filters
  Object.keys(filters).forEach(key => {
    if (!filters[key]) delete filters[key];
  });

  const { 
    data, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteLeadsList(filters);

  const leads = data?.pages.flatMap(page => page.items) || [];
  const changeStageMutation = useChangeStage();

  const handleStageChange = ({ id, stage }) => {
    changeStageMutation.mutate({ id, stage });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-df-textlight">Leads</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400 dark:text-df-text" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-df-border bg-white dark:bg-df-card rounded-lg w-64 focus:ring-1 focus:ring-df-accent focus:border-df-accent outline-none text-sm text-gray-900 dark:text-df-textlight transition-colors"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-df-accent hover:bg-opacity-90 text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors text-sm"
          >
            <FiPlus /> New Lead
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2 items-center overflow-x-auto pb-1 scrollbar-hide">
          {['', 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won'].map((stage) => {
             const isSelected = statusFilter === stage;
             return (
               <button
                 key={stage}
                 onClick={() => setStatusFilter(stage)}
                 className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                   isSelected 
                   ? 'border border-df-accent text-df-accent bg-df-accent/5' 
                   : 'border border-gray-200 dark:border-df-border text-gray-600 dark:text-df-text hover:border-gray-300 dark:hover:border-df-text'
                 }`}
               >
                 {stage || 'All Stages'}
               </button>
             );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold text-gray-700 dark:text-df-textlight bg-white dark:bg-[#1a222c] border border-gray-200 dark:border-df-border hover:bg-gray-50 dark:hover:bg-df-cardhover transition-colors">
            Export <span className="text-xs">↓</span>
          </button>
          <div className="flex bg-gray-100 dark:bg-[#10151b] rounded-lg p-1 border border-gray-200 dark:border-df-border">
            <button 
              onClick={() => setView('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'table' ? 'bg-white dark:bg-df-card shadow-sm text-gray-900 dark:text-df-textlight' : 'text-gray-500 dark:text-df-text hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <FiList />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white dark:bg-df-card shadow-sm text-gray-900 dark:text-df-textlight' : 'text-gray-500 dark:text-df-text hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <FiTrello />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'table' ? (
          <LeadsTable 
            leads={leads} 
            isLoading={isLoading} 
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        ) : (
          <LeadsKanban 
            leads={leads} 
            isLoading={isLoading} 
            onChangeStage={handleStageChange} 
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        )}
      </div>

      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default LeadsList;
