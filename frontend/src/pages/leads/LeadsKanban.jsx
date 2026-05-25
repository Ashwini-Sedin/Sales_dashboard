import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StageBadge from './StageBadge';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'On Hold', 'Closed Won', 'Closed Lost'];

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

const LeadsKanban = ({ leads, isLoading, onChangeStage, fetchNextPage, hasNextPage, isFetchingNextPage }) => {
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
    onChangeStage({ id: draggableId, stage: backendStatus });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Kanban...</div>;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-gray-100 dark:bg-df-sidebar rounded-lg w-80 flex-shrink-0 flex flex-col max-h-full overflow-hidden border border-gray-200 dark:border-df-border">
            <div className="p-3 border-b border-gray-200 dark:border-df-border flex justify-between items-center bg-gray-50 dark:bg-[#10151b] rounded-t-lg">
              <h3 className="font-semibold text-gray-700 dark:text-df-textlight">{stage}</h3>
              <span className="bg-gray-200 dark:bg-df-border text-gray-600 dark:text-df-text text-xs px-2 py-1 rounded-full font-bold">
                {columns[stage].length}
              </span>
            </div>
            
            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  onScroll={handleScroll}
                  className={`p-3 flex-1 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/10' : ''}`}
                >
                  {columns[stage].map((lead, index) => {
                    const daysInStage = calculateDaysInStage(lead.updated_at || lead.created_at);
                    const daysColor = daysInStage > 14 ? 'text-red-600 bg-red-55/20 border-red-200/50' : daysInStage > 7 ? 'text-amber-600 bg-amber-55/20 border-amber-200/50' : 'text-gray-500 bg-gray-50 dark:bg-df-sidebar dark:text-df-text';

                    return (
                      <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-[#141a21] p-4 rounded-lg shadow-sm mb-3 border border-gray-200 dark:border-df-border hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500/50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-gray-900 dark:text-df-textlight">{lead.first_name} {lead.last_name}</h4>
                              {(lead.lead_score || 0) > 0 && (
                                <span className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 text-xs px-1.5 py-0.5 rounded font-bold">
                                  {lead.lead_score}
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-500 dark:text-df-text mb-3">{lead.company_name || 'No Company'}</div>
                            <div className="flex justify-between items-center mt-2">
                              <StageBadge stage={getFrontendStage(lead.status)} />
                              <div className={`text-xs px-2 py-0.5 rounded border font-medium ${daysColor}`}>
                                {daysInStage} {daysInStage === 1 ? 'day' : 'days'}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center gap-1.5 py-3 text-[#0ebf99]">
                      <div className="w-4 h-4 border-2 border-[#0ebf99] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold">Loading...</span>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default LeadsKanban;
