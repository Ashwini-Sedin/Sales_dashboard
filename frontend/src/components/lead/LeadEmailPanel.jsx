import React, { useState } from 'react';
import { FiEdit, FiMail } from 'react-icons/fi';
import { useEmails } from '../../hooks/useEmails';
import EmailComposeModal from './EmailComposeModal';
import EmailThread from './EmailThread';

const LeadEmailPanel = ({ leadId, lead }) => {
  const { data: emails = [], isLoading } = useEmails(leadId);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-df-sidebar rounded-xl shadow-sm border border-slate-200 dark:border-df-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-df-border flex justify-between items-center bg-slate-50/50 dark:bg-df-sidebar">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-df-textlight">Emails</h3>
          {!isLoading && (
            <span className="bg-slate-200 dark:bg-df-card text-slate-600 dark:text-df-text text-xs py-0.5 px-2 rounded-full font-medium">
              {emails.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <FiEdit /> Compose
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-[#0f171e]/50">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-slate-400 dark:text-df-text">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-df-text">
            <div className="bg-slate-100 dark:bg-df-card p-4 rounded-full mb-3">
              <FiMail className="w-8 h-8 text-slate-400 dark:text-df-text" />
            </div>
            <p className="font-medium text-slate-600 dark:text-df-textlight mb-1">No emails yet</p>
            <p className="text-sm">Emails synced from Outlook will appear here.</p>
          </div>
        ) : (
          <EmailThread emails={emails} leadId={leadId} />
        )}
      </div>

      {composeOpen && (
        <EmailComposeModal 
          leadId={leadId} 
          lead={lead} 
          onClose={() => setComposeOpen(false)} 
        />
      )}
    </div>
  );
};

export default LeadEmailPanel;
