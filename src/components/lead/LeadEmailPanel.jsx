import React, { useState } from 'react';
import { FiEdit, FiMail } from 'react-icons/fi';
import { useEmails } from '../../hooks/useEmails';
import EmailThread from './EmailThread';
import { format } from 'date-fns';

const LeadEmailPanel = ({ leadId, lead }) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { data: emails = [], isLoading } = useEmails(leadId, selectedMonth);

  const emailList = Array.isArray(emails) ? emails : (emails?.items || []);

  return (
    <div className="bg-white dark:bg-df-card rounded-xl shadow-sm border border-slate-200 dark:border-df-border overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-df-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 dark:text-white">Emails</h3>
          {!isLoading && (
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-gray-300 text-xs py-0.5 px-2 rounded-full font-medium">
              {emailList.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-slate-400 dark:text-gray-500">Loading emails...</div>
        ) : emailList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-gray-500">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
              <FiMail className="w-8 h-8 text-slate-400 dark:text-gray-500" />
            </div>
            <p className="font-medium text-slate-600 dark:text-gray-400 mb-1">No emails yet</p>
            <p className="text-sm dark:text-gray-500">Emails synced from Outlook will appear here.</p>
          </div>
        ) : (
          <EmailThread emails={emailList} leadId={leadId} />
        )}
      </div>
    </div>
  );
};

export default LeadEmailPanel;
