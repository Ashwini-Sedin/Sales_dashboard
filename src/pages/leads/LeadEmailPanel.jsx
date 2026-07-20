import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdOutlineEmail, MdAdd } from 'react-icons/md';
import axiosInstance from '../../api/axios';
import EmailThread from './EmailThread';
import EmailComposeModal from '../../components/lead/EmailComposeModal';

const LeadEmailPanel = ({ leadId, lead }) => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: emailsData, isLoading, error } = useQuery({
    queryKey: ['leadEmails', leadId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/leads/${leadId}/emails`, {
        params: { limit: 100 }
      });
      return response.data;
    },
    enabled: !!leadId,
    refetchInterval: 30000, // Poll every 30s to get updates or webhook syncs
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (composeData) => {
      const response = await axiosInstance.post(`/api/leads/${leadId}/emails/send`, composeData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both timeline (for the new activity) and emails
      queryClient.invalidateQueries(['leadTimeline', leadId]);
      
      // Delay slightly for webhook/sync to pick up the sent email
      setTimeout(() => {
        queryClient.invalidateQueries(['leadEmails', leadId]);
      }, 2000);
    }
  });

  const handleSendEmail = async (composeData) => {
    await sendEmailMutation.mutateAsync(composeData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col col-span-2">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <MdOutlineEmail className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800">Email Threads</h3>
        </div>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MdAdd className="w-4 h-4" /> Compose
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Loading emails...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg">
            <p>Failed to load emails: {error.message}</p>
          </div>
        ) : (
          <EmailThread emails={emailsData?.items || []} leadId={leadId} />
        )}
      </div>

      <EmailComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        leadEmail={lead?.email}
        onSend={handleSendEmail}
      />
    </div>
  );
};

export default LeadEmailPanel;
