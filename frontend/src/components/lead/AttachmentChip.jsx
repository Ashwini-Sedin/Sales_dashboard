import React from 'react';
import { FiFileText, FiImage, FiFile } from 'react-icons/fi';
import api from '../../api';

const AttachmentChip = ({ attachment, leadId, messageId }) => {
  const isPdf = attachment.content_type?.includes('pdf');
  const isImage = attachment.content_type?.includes('image');
  
  const Icon = isPdf ? FiFileText : isImage ? FiImage : FiFile;
  
  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const displayName = attachment.filename?.length > 30 
    ? attachment.filename.substring(0, 27) + '...' 
    : attachment.filename;

  const handleDownload = async () => {
    try {
      const res = await api.get(`/api/leads/${leadId}/emails/${messageId}/attachments/${attachment.id}/download`);
      const data = res.data || res;
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to download attachment', error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-1 px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm transition-colors mr-2 mb-2"
      title={attachment.filename}
    >
      <Icon className="text-gray-500 w-3.5 h-3.5" />
      <span className="text-gray-700 truncate">{displayName}</span>
      <span className="text-gray-400 text-xs ml-1">({formatSize(attachment.size_bytes)})</span>
    </button>
  );
};

export default AttachmentChip;
