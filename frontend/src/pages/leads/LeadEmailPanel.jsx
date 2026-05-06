import React from 'react';
import { MdOutlineEmail } from 'react-icons/md';

const LeadEmailPanel = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <MdOutlineEmail className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Email Sync</h3>
      <p className="text-slate-500 max-w-md">
        Emails sync automatically from Outlook. Integration set up in Phase 2.
      </p>
    </div>
  );
};

export default LeadEmailPanel;
