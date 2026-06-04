import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdOutlineCall, MdOutlineDelete, MdPlayArrow, MdClose } from 'react-icons/md';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import axiosInstance from '../../api/axios';
import CallDetailModal from './CallDetailModal';

const LeadCallsPanel = ({ leadId }) => {
  const [selectedCall, setSelectedCall] = useState(null);
  const queryClient = useQueryClient();

  const { data: callsData, isLoading, error } = useQuery({
    queryKey: ['leadCalls', leadId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/leads/${leadId}/calls`);
      return response.data;
    },
    enabled: !!leadId,
    refetchInterval: 30000, // Poll every 30s
  });

  const deleteMutation = useMutation({
    mutationFn: async (callId) => {
      await axiosInstance.delete(`/api/leads/${leadId}/calls/${callId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leadCalls', leadId]);
      queryClient.invalidateQueries(['leadTimeline', leadId]);
    }
  });

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500">Loading call recordings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">Failed to load calls</p>
          <p className="text-slate-400 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const calls = callsData || [];

  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <MdOutlineCall className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Call Recordings</h3>
        <p className="text-slate-500 max-w-md">
          No Teams call recordings yet. Calls with this lead will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <MdOutlineCall className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800">Call Recordings</h3>
          <span className="ml-auto text-sm text-slate-500">({calls.length})</span>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[600px]">
        <div className="divide-y divide-slate-100">
          {calls.map((call) => (
            <div key={call.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <MdPlayArrow className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {call.filename || 'Call Recording'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <AiOutlineCalendar className="w-3.5 h-3.5" />
                          {formatDate(call.recorded_at)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <AiOutlineClockCircle className="w-3.5 h-3.5" />
                          {formatDuration(call.duration_seconds)}
                        </div>
                        {call.file_size_bytes && (
                          <div className="text-xs text-slate-500">
                            {(call.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedCall(call)}
                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(call.id)}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete recording"
                  >
                    <MdOutlineDelete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          leadId={leadId}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
};

export default LeadCallsPanel;
