import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useLeadTimeline, useAddLeadNote } from '../../hooks/useLeadDetail';
import { 
  MdOutlineEventNote, 
  MdOutlineEmail, 
  MdOutlineCall, 
  MdOutlineDescription,
  MdOutlineSystemUpdateAlt,
  MdSend
} from 'react-icons/md';

const getEventIcon = (type) => {
  switch (type) {
    case 'note': return <MdOutlineEventNote className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'email': return <MdOutlineEmail className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'call': return <MdOutlineCall className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'document': return <MdOutlineDescription className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    default: return <MdOutlineSystemUpdateAlt className="w-5 h-5 text-slate-600 dark:text-df-text" />;
  }
};

const getEventBg = (type) => {
  switch (type) {
    case 'note': return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700/50';
    case 'email': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50';
    case 'call': return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700/50';
    case 'document': return 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700/50';
    default: return 'bg-slate-100 dark:bg-df-card border-slate-200 dark:border-df-border';
  }
};

const LeadTimeline = ({ leadId }) => {
  const { data: timeline = [], isLoading } = useLeadTimeline(leadId);
  const addNoteMutation = useAddLeadNote();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    addNoteMutation.mutate({ leadId, note: noteContent }, {
      onSuccess: () => {
        setNoteContent('');
        setIsAddingNote(false);
      }
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading timeline...</div>;
  }

  return (
    <div className="bg-white dark:bg-df-sidebar rounded-xl shadow-sm border border-slate-200 dark:border-df-border overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-df-border flex justify-between items-center bg-slate-50/50 dark:bg-df-sidebar">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-df-textlight">Activity Timeline</h3>
        <button 
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
        >
          {isAddingNote ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {isAddingNote && (
        <form onSubmit={handleAddNote} className="p-4 bg-yellow-50/30 dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/20">
          <textarea 
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full text-sm border-slate-200 dark:border-df-border rounded-md bg-white dark:bg-df-card focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-none text-slate-900 dark:text-df-textlight"
            placeholder="Type your note here..."
            autoFocus
          ></textarea>
          <div className="flex justify-end mt-2">
            <button 
              type="submit" 
              disabled={addNoteMutation.isPending || !noteContent.trim()}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {addNoteMutation.isPending ? 'Saving...' : <><MdSend className="w-4 h-4 mr-1.5"/> Save Note</>}
            </button>
          </div>
        </form>
      )}

      <div className="p-6 overflow-y-auto flex-1">
        {timeline.length > 0 ? (
          <div className="relative border-l-2 border-slate-100 dark:border-df-border ml-4 space-y-8 pb-4">
            {timeline.map((event, idx) => (
              <div key={event.id || idx} className="relative pl-8">
                <div className={`absolute -left-[17px] top-0.5 w-8 h-8 rounded-full border flex items-center justify-center shadow-sm ${getEventBg(event.event_type)}`}>
                  {getEventIcon(event.event_type)}
                </div>
                
                <div className="bg-slate-50 dark:bg-df-card border border-slate-100 dark:border-df-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-df-sidebar flex items-center justify-center text-xs font-bold text-slate-600 dark:text-df-text">
                        {event.actor_name ? event.actor_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="font-medium text-sm text-slate-800 dark:text-df-textlight">{event.actor_name || 'System User'}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-df-text font-medium">
                      {event.created_at ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true }) : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-df-text leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-10">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadTimeline;
