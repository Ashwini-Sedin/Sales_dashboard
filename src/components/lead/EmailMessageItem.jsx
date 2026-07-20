import React from 'react';
import { format } from 'date-fns';
import { useEmailAttachments } from '../../hooks/useEmails';
import AttachmentChip from './AttachmentChip';

const EmailMessageItem = ({ message, leadId }) => {
  const { data: attachments = [] } = useEmailAttachments(leadId, message.id, message.has_attachments);

  const formatRecipients = (recipients) => {
    if (!recipients || !Array.isArray(recipients)) return '';
    return recipients.map(r => r.name || r.email).join(', ');
  };

  const handleIframeLoad = (e) => {
    try {
      const iframe = e.target;
      const height = iframe.contentDocument.body.scrollHeight;
      iframe.style.height = `${height}px`;
      
      // Inject dark mode text color if needed (only white text)
      if (document.documentElement.classList.contains('dark')) {
        const style = iframe.contentDocument.createElement('style');
        style.textContent = 'body { color: white !important; } * { color: white !important; }';
        iframe.contentDocument.head.appendChild(style);
      }
    } catch (err) {
      // Cross-origin issues or iframe empty
    }
  };

  return (
    <div className="py-4 px-2">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-bold text-gray-900 dark:text-white mr-2">{message.sender_name}</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">&lt;{message.sender_email}&gt;</span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {(message.received_at || message.created_at) && format(new Date(message.received_at || message.created_at), 'dd MMM yyyy, hh:mm a')}
        </div>
      </div>
      
      <div className="mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">To:</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{formatRecipients(message.recipients)}</span>
      </div>

      <div className="bg-white dark:bg-df-bg rounded border border-gray-100 dark:border-df-border mb-3 overflow-hidden">
        <iframe
          srcDoc={message.body_html || message.body_preview}
          sandbox="allow-same-origin"
          style={{ width: '100%', minHeight: '200px', border: 'none' }}
          onLoad={handleIframeLoad}
          title={`email-content-${message.id}`}
        />
      </div>

      {message.has_attachments && attachments.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Attachments:</div>
          <div className="flex flex-wrap">
            {attachments.map(att => (
              <AttachmentChip key={att.id} attachment={att} leadId={leadId} messageId={message.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailMessageItem;
