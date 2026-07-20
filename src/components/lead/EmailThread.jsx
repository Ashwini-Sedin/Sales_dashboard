import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import EmailMessageItem from './EmailMessageItem';

const ThreadGroup = ({ subject, emails, leadId, defaultExpanded }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  // Sort messages in thread chronologically for display
  const sortedMessages = [...emails].sort((a, b) => new Date(a.received_at || a.created_at) - new Date(b.received_at || b.created_at));
  const mostRecent = sortedMessages[sortedMessages.length - 1];

  return (
    <div className="bg-white dark:bg-df-card border border-gray-200 dark:border-df-border rounded-lg mb-4 overflow-hidden shadow-sm">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-baseline gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{mostRecent.subject || subject || '(No Subject)'}</h3>
            {emails.length > 1 && (
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">({emails.length})</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px]">
            {mostRecent.sender_name}
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {(mostRecent.received_at || mostRecent.created_at) && formatDistanceToNow(new Date(mostRecent.received_at || mostRecent.created_at), { addSuffix: true })}
          </div>
          
          <div>
            {mostRecent.is_outgoing ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                Sent
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                Received
              </span>
            )}
          </div>
          
          <div className="text-gray-400 dark:text-gray-500">
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-2 border-t border-gray-200 dark:border-df-border divide-y divide-gray-100 dark:divide-slate-800">
          {sortedMessages.map((msg) => (
            <EmailMessageItem key={msg.id} message={msg} leadId={leadId} />
          ))}
        </div>
      )}
    </div>
  );
};

const EmailThread = ({ emails, leadId }) => {
  // Group emails by subject (ignore Re:, Fwd: prefixes for a robust implementation, but for now simple trim)
  const grouped = (emails || []).reduce((acc, email) => {
    // Simple subject grouping
    let subject = (email.subject || '').trim();
    const cleanSubject = subject.replace(/^(Re|Fwd|FW):\s*/i, '').toLowerCase();
    
    if (!acc[cleanSubject]) {
      acc[cleanSubject] = [];
    }
    acc[cleanSubject].push(email);
    return acc;
  }, {});

  // Convert to array and sort by most recent email in each group
  const threads = Object.entries(grouped).map(([key, groupEmails]) => {
    const sorted = [...groupEmails].sort((a, b) => new Date(b.received_at || b.created_at) - new Date(a.received_at || a.created_at));
    return {
      key,
      subject: sorted[0].subject,
      emails: sorted,
      latestDate: new Date(sorted[0].received_at || sorted[0].created_at)
    };
  }).sort((a, b) => b.latestDate - a.latestDate);

  return (
    <div className="space-y-2">
      {threads.map((thread, index) => (
        <ThreadGroup 
          key={thread.key || index} 
          subject={thread.subject} 
          emails={thread.emails} 
          leadId={leadId}
          defaultExpanded={index === 0} 
        />
      ))}
    </div>
  );
};

export default EmailThread;
