import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StageBadge from './StageBadge';

const STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const calculateDaysInStage = (updatedAt) => {
  if (!updatedAt) return 0;
  const updatedDate = new Date(updatedAt);
  const today = new Date();
  const diffTime = Math.abs(today - updatedDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const LeadsKanban = ({ leads, isLoading, onChangeStage }) => {
  const columns = useMemo(() => {
    const cols = STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {});
    
    if (leads) {
      leads.forEach(lead => {
        if (cols[lead.stage]) {
          cols[lead.stage].push(lead);
        } else {
           // Fallback if stage is unmapped
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
    onChangeStage({ id: draggableId, stage: newStage });
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Kanban...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
        {STAGES.map((stage) => (
          <div key={stage} className="bg-gray-100 rounded-lg w-80 flex-shrink-0 flex flex-col">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="font-semibold text-gray-700">{stage}</h3>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                {columns[stage].length}
              </span>
            </div>
            
            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-3 min-h-[500px] flex-1 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                >
                  {columns[stage].map((lead, index) => {
                    const daysInStage = calculateDaysInStage(lead.updated_at || lead.created_at);
                    const daysColor = daysInStage > 14 ? 'text-red-600 bg-red-50' : daysInStage > 7 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-50';

                    return (
                      <Draggable key={lead.id.toString()} draggableId={lead.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded shadow-sm mb-3 border border-gray-200 hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{lead.name}</h4>
                              {lead.score > 0 && (
                                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded font-medium">
                                  {lead.score}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-3">{lead.company}</div>
                            <div className="flex justify-between items-center mt-2">
                              <StageBadge stage={lead.stage} />
                              <div className={`text-xs px-2 py-1 rounded font-medium ${daysColor}`}>
                                {daysInStage} {daysInStage === 1 ? 'day' : 'days'}
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
        ))}
      </div>
    </DragDropContext>
  );
};

export default LeadsKanban;
