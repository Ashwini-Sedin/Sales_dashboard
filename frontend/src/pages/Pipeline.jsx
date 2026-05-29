import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLeadsList, useChangeStage } from '../hooks/useLeads';
import CreateLeadModal from './leads/CreateLeadModal';
import { FiSearch, FiDollarSign, FiAward, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'On Hold', 'Closed Won', 'Closed Lost'];

const COLUMN_THEMES = {
  'New': {
    title: 'New',
    border: 'border-t-4 border-t-slate-400',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50/50',
    counterBg: 'bg-slate-100 text-slate-600',
  },
  'Contacted': {
    title: 'Contacted',
    border: 'border-t-4 border-t-violet-500',
    dot: 'bg-violet-500',
    bg: 'bg-violet-50/10',
    counterBg: 'bg-violet-50 text-violet-600 border border-violet-100',
  },
  'Qualified': {
    title: 'Qualified',
    border: 'border-t-4 border-t-emerald-500',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50/10',
    counterBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  'Proposal': {
    title: 'Proposal',
    border: 'border-t-4 border-t-lime-500',
    dot: 'bg-lime-500',
    bg: 'bg-lime-50/10',
    counterBg: 'bg-lime-50 text-lime-600 border border-lime-100',
  },
  'Negotiation': {
    title: 'Negotiation',
    border: 'border-t-4 border-t-pink-500',
    dot: 'bg-pink-500',
    bg: 'bg-pink-50/10',
    counterBg: 'bg-pink-50 text-pink-600 border border-pink-100',
  },
  'On Hold': {
    title: 'On Hold',
    border: 'border-t-4 border-t-amber-500',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50/10',
    counterBg: 'bg-amber-50 text-amber-600 border border-amber-100',
  },
  'Closed Won': {
    title: 'Won',
    border: 'border-t-4 border-t-teal-500',
    dot: 'bg-teal-500',
    bg: 'bg-teal-50/10',
    counterBg: 'bg-teal-50 text-teal-600 border border-teal-100',
  },
  'Closed Lost': {
    title: 'Lost',
    border: 'border-t-4 border-t-rose-400',
    dot: 'bg-rose-400',
    bg: 'bg-rose-50/10',
    counterBg: 'bg-rose-50 text-rose-600 border border-rose-100',
  }
};

const getFrontendStage = (status) => {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s === 'new') return 'New';
  if (s === 'contacted') return 'Contacted';
  if (s === 'qualified') return 'Qualified';
  if (s === 'proposal_sent' || s === 'proposal') return 'Proposal';
  if (s === 'negotiation') return 'Negotiation';
  if (s === 'on_hold' || s === 'on hold') return 'On Hold';
  if (s === 'won' || s === 'closed_won' || s === 'closed won') return 'Closed Won';
  if (s === 'lost' || s === 'closed_lost' || s === 'closed lost') return 'Closed Lost';
  return 'New';
};

const getBackendStatus = (stage) => {
  if (!stage) return 'new';
  if (stage === 'New') return 'new';
  if (stage === 'Contacted') return 'contacted';
  if (stage === 'Qualified') return 'qualified';
  if (stage === 'Proposal') return 'proposal_sent';
  if (stage === 'Negotiation') return 'negotiation';
  if (stage === 'On Hold') return 'on_hold';
  if (stage === 'Closed Won') return 'won';
  if (stage === 'Closed Lost') return 'lost';
  return 'new';
};

const calculateDaysInStage = (updatedAt) => {
  if (!updatedAt) return 0;
  const updatedDate = new Date(updatedAt);
  const today = new Date();
  const diffTime = Math.abs(today - updatedDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const getSourceBadge = (source) => {
  if (!source) return 'Other';
  if (source.toLowerCase().includes('ads')) return 'Ads';
  if (source.toLowerCase().includes('manual')) return 'Manual';
  if (source.toLowerCase().includes('referral') || source.toLowerCase().includes('ref')) return 'Ref';
  if (source.toLowerCase().includes('event')) return 'Event';
  return source;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null) return '$0';
  const num = Number(value);
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
};

const getScoreStyle = (score) => {
  const s = score || 0;
  if (s >= 80) return 'bg-orange-55/35 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border-orange-100/30 dark:border-orange-950/30';
  if (s >= 50) return 'bg-amber-55/35 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100/30 dark:border-amber-950/30';
  return 'bg-blue-55/35 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100/30 dark:border-blue-950/30';
};

const getDaysStyle = (days) => {
  if (days > 14) return 'bg-red-55/35 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-100/30 dark:border-red-950/30';
  if (days > 7) return 'bg-violet-55/35 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border-violet-100/30 dark:border-violet-950/30';
  return 'bg-slate-55/35 text-slate-600 dark:bg-slate-950/20 dark:text-slate-400 border-slate-100/30 dark:border-slate-950/30';
};

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

const Pipeline = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filters = {
    search: debouncedSearch,
    limit: 1000,
  };

  if (!filters.search) delete filters.search;

  const { data: leads, isLoading } = useLeadsList(filters);
  const changeStageMutation = useChangeStage();

  const columns = useMemo(() => {
    const cols = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});
    
    if (leads) {
      leads.forEach(lead => {
        const stageName = getFrontendStage(lead.status);
        if (cols[stageName]) {
          cols[stageName].push(lead);
        } else {
          if (!cols['New']) cols['New'] = [];
          cols['New'].push(lead);
        }
      });
    }
    return cols;
  }, [leads]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const newStage = destination.droppableId;
    const backendStatus = getBackendStatus(newStage);
    changeStageMutation.mutate({ id: draggableId, stage: backendStatus });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden space-y-6">
      {/* Top Header Section */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pipeline – Kanban</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Drag cards between columns to change stage</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-df-border rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-df-sidebar dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-x-auto min-h-0 pb-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-gray-500 dark:text-gray-400 animate-pulse">
            Loading Pipeline...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 h-full items-start">
              {STAGES.map((stage) => {
                const theme = COLUMN_THEMES[stage];
                return (
                  <div key={stage} className={`flex flex-col w-[320px] max-h-full flex-shrink-0 bg-gray-50/50 dark:bg-df-sidebar/30 border border-gray-100 dark:border-df-border/50 rounded-xl overflow-hidden ${theme.border}`}>
                    {/* Column Header */}
                    <div className="p-4 flex justify-between items-center bg-white dark:bg-df-sidebar/80 border-b border-gray-100 dark:border-df-border/80">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm">{theme.title}</h3>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.counterBg}`}>
                        {columns[stage].length}
                      </span>
                    </div>
                    
                    {/* Droppable Area */}
                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-3 overflow-y-auto flex-1 min-h-[150px] transition-colors ${
                            snapshot.isDraggingOver ? 'bg-indigo-50/30 dark:bg-df-cardhover/20' : ''
                          }`}
                        >
                          {columns[stage].map((lead, index) => {
                            const daysInStage = calculateDaysInStage(lead.updated_at || lead.created_at);
                            const daysStyleClass = getDaysStyle(daysInStage);

                            return (
                              <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white dark:bg-[#141a21] p-4 rounded-xl shadow-sm mb-3 border border-gray-100 dark:border-df-border hover:shadow-md hover:-translate-y-0.5 transition-all select-none ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500/50' : ''
                                    }`}
                                  >
                                    {/* Top Row: Company Name & Source Pill */}
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FiBriefcase className="text-indigo-500/85 dark:text-indigo-400/85 w-4 h-4 flex-shrink-0" />
                                        <Link to={`/leads/${lead.id}`} className="font-bold text-gray-900 dark:text-white text-sm hover:text-[#0ebf99] cursor-pointer transition-colors truncate" title={lead.company_name}>
                                          {lead.company_name || 'No Company'}
                                        </Link>
                                      </div>
                                      
                                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50/60 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-950/30 whitespace-nowrap flex-shrink-0">
                                        Source: {getSourceBadge(lead.source)}
                                      </span>
                                    </div>

                                    {/* Contact Person */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                      <FiUser className="w-3.5 h-3.5" />
                                      <span className="font-medium text-gray-700 dark:text-df-textlight">
                                        Contact: {lead.first_name} {lead.last_name}
                                      </span>
                                    </div>

                                    {/* Subtle separator */}
                                    <div className="border-t border-gray-100 dark:border-df-border/30 my-3" />

                                    {/* Value, Score, and Age Row */}
                                    <div className="flex flex-col gap-2">
                                      {/* Deal Value */}
                                      <div className="flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-950/10 px-2.5 py-1.5 rounded-lg border border-emerald-100/30 dark:border-emerald-950/30">
                                        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                          <FiDollarSign className="text-emerald-500 w-3.5 h-3.5" />
                                          <span>Value:</span>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                          {formatCurrency(lead.estimated_value)}
                                        </span>
                                      </div>

                                      {/* Age and Score Grid */}
                                      <div className="grid grid-cols-2 gap-2">
                                        {/* Lead Score */}
                                        <div className={`flex flex-col gap-0.5 p-2 rounded-lg border ${getScoreStyle(lead.lead_score)}`}>
                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                                            <FiAward className="w-3 h-3" /> Score
                                          </span>
                                          <span className="text-xs font-bold mt-0.5">
                                            {lead.lead_score || 0}
                                          </span>
                                        </div>

                                        {/* Age */}
                                        <div className={`flex flex-col gap-0.5 p-2 rounded-lg border ${daysStyleClass}`}>
                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                                            <FiClock className="w-3 h-3" /> Age
                                          </span>
                                          <span className="text-xs font-bold mt-0.5">
                                            {daysInStage} {daysInStage === 1 ? 'day' : 'days'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <CreateLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Pipeline;
