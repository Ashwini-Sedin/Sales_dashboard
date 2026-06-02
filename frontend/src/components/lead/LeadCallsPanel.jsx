import React from 'react';
import { FiPhone } from 'react-icons/fi';
import { useCallRecordings } from '../../hooks/useCallRecordings';
import CallRecordingCard from './CallRecordingCard';

const LeadCallsPanel = ({ leadId }) => {
  const { data: calls = [], isLoading } = useCallRecordings(leadId);

  const sortedCalls = [...calls].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

  return (
    <div className="bg-white dark:bg-df-sidebar rounded-xl shadow-sm border border-slate-200 dark:border-df-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-df-border flex justify-between items-center bg-slate-50/50 dark:bg-df-sidebar">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-df-textlight">Call Recordings</h3>
          {!isLoading && (
            <span className="bg-slate-200 dark:bg-df-card text-slate-600 dark:text-df-text text-xs py-0.5 px-2 rounded-full font-medium">
              {calls.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-[#0f171e]/50">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-slate-400 dark:text-df-text">Loading calls...</div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-df-text">
            <div className="bg-slate-100 dark:bg-df-card p-4 rounded-full mb-3">
              <FiPhone className="w-8 h-8 text-slate-400 dark:text-df-text" />
            </div>
            <p className="font-medium text-slate-600 dark:text-df-textlight mb-1">No call recordings yet</p>
            <p className="text-sm text-center max-w-xs">Teams calls linked to this lead will appear here automatically.</p>
          </div>
        ) : (
          <div>
            {sortedCalls.map((call) => (
              <CallRecordingCard key={call.id} recording={call} leadId={leadId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCallsPanel;
