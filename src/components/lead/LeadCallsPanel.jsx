import React from 'react';
import { FiPhone } from 'react-icons/fi';
import { useCallRecordings } from '../../hooks/useCallRecordings';
import CallRecordingCard from './CallRecordingCard';

const LeadCallsPanel = ({ leadId }) => {
  const { data: calls = [], isLoading } = useCallRecordings(leadId);

  const sortedCalls = [...calls].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

  return (
    <div className="bg-white dark:bg-df-card rounded-xl shadow-sm border border-slate-200 dark:border-df-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-df-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-white">Call Recordings</h3>
          {!isLoading && (
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full font-medium">
              {calls.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-slate-400 dark:text-gray-500">Loading calls...</div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-gray-500">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
              <FiPhone className="w-8 h-8 text-slate-400 dark:text-gray-500" />
            </div>
            <p className="font-medium text-slate-600 dark:text-gray-400 mb-1">No call recordings yet</p>
            <p className="text-sm text-center max-w-xs dark:text-gray-500">Teams calls linked to this lead will appear here automatically.</p>
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
