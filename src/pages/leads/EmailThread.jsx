import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MdOutlineEmail, MdExpandMore, MdExpandLess, MdAttachFile, MdDownload } from 'react-icons/md';

const EmailIframe = ({ htmlContent }) => {
  return (
    <iframe
      srcDoc={htmlContent || '<p>No content</p>'}
      className="w-full min-h-[200px] border-0 mt-2 bg-white rounded-md"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      title="Email Body"
      onLoad={(e) => {
        // Adjust height based on content
        try {
          const body = e.target.contentWindow.document.body;
          e.target.style.height = `${body.scrollHeight + 20}px`;
        } catch (err) {
          // Cross-origin issues might prevent accessing contentWindow
        }
      }}
    />
  );
};

const EmailMessage = ({ email, defaultExpanded = false, leadId }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border-l-2 ${email.is_outgoing ? 'border-blue-400' : 'border-indigo-400'} ml-4 pl-4 py-3 border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50`}>
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">
              {email.sender_name || email.sender_email}
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {email.is_outgoing ? 'Sent' : 'Received'}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>To: {email.recipients?.map(r => r.name || r.email).join(', ') || 'Unknown'}</span>
            <span className="text-slate-300">•</span>
            <span>{format(new Date(email.received_at || email.created_at), 'MMM d, h:mm a')}</span>
          </div>
          
          {!isExpanded && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-1">
              {email.body_preview || 'No preview available.'}
            </p>
          )}
        </div>
        
        <button className="text-slate-400 hover:text-slate-600 p-1">
          {isExpanded ? <MdExpandLess className="w-5 h-5" /> : <MdExpandMore className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <EmailIframe htmlContent={email.body_html} />
          
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap gap-2">
              {email.attachments.map(att => (
                <a
                  key={att.id}
                  href={`/api/leads/${leadId}/emails/${email.message_id}/attachments/${att.attachment_id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-sm text-slate-700"
                >
                  <MdAttachFile className="w-4 h-4 text-slate-500" />
                  <span className="truncate max-w-[150px]">{att.filename}</span>
                  <MdDownload className="w-4 h-4 ml-1 text-slate-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EmailThreadItem = ({ subject, emails, leadId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const latestEmail = emails[0]; // Assuming pre-sorted by date desc
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition-shadow">
      <div 
        className={`p-4 cursor-pointer flex items-start gap-4 ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${latestEmail.is_outgoing ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
          <MdOutlineEmail className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-slate-800 truncate pr-4">
              {subject || '(No Subject)'}
            </h4>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {format(new Date(latestEmail.received_at || latestEmail.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
            <span className="truncate max-w-[200px]">
              {latestEmail.sender_name || latestEmail.sender_email}
            </span>
            {emails.length > 1 && (
              <span className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {emails.length}
              </span>
            )}
          </div>
          
          {!isExpanded && (
            <p className="text-sm text-slate-500 truncate">
              {latestEmail.body_preview || 'No preview available.'}
            </p>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white pb-2">
          {/* Reverse array to show oldest first in the thread */}
          {[...emails].reverse().map((email, index) => (
            <EmailMessage 
              key={email.id} 
              email={email} 
              leadId={leadId}
              defaultExpanded={index === emails.length - 1} // Only expand the newest message by default
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EmailThread = ({ emails, leadId }) => {
  // Group emails by subject (cleaning up Re:, Fwd: prefixes)
  const threads = useMemo(() => {
    if (!emails || emails.length === 0) return [];
    
    const groups = {};
    emails.forEach(email => {
      let cleanSubject = (email.subject || '(No Subject)').replace(/^(re|fwd|fw):\s*/i, '').trim();
      if (!groups[cleanSubject]) {
        groups[cleanSubject] = [];
      }
      groups[cleanSubject].push(email);
    });
    
    // Sort threads by the date of their most recent email
    return Object.entries(groups).map(([subject, threadEmails]) => {
      // Sort emails within thread: newest first
      threadEmails.sort((a, b) => new Date(b.received_at || b.created_at) - new Date(a.received_at || a.created_at));
      return {
        subject,
        emails: threadEmails,
        latestDate: new Date(threadEmails[0].received_at || threadEmails[0].created_at)
      };
    }).sort((a, b) => b.latestDate - a.latestDate);
    
  }, [emails]);

  if (!emails || emails.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdOutlineEmail className="w-8 h-8" />
        </div>
        <h3 className="text-slate-700 font-medium mb-1">No emails yet</h3>
        <p className="text-sm text-slate-500">Emails sent and received will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map(thread => (
        <EmailThreadItem 
          key={thread.subject} 
          subject={thread.subject} 
          emails={thread.emails} 
          leadId={leadId}
        />
      ))}
    </div>
  );
};

export default EmailThread;
