import React, { useState, useEffect } from 'react';
import { 
  FiLoader, FiCheckCircle, FiXCircle, 
  FiDownload, FiExternalLink, FiArrowRight 
} from 'react-icons/fi';
import { useTaskStatus, useDocumentDownload } from '../../hooks/useDocuments';
import { useQueryClient } from '@tanstack/react-query';

const GenerationProgressModal = ({ taskId, documentId, leadId, onClose, onComplete }) => {
  const queryClient = useQueryClient();
  const downloadDocument = useDocumentDownload();
  const { data: task, error: taskError } = useTaskStatus(taskId);
  const [progress, setProgress] = useState(0);

  // Status mapping from backend: Queued, In Progress, Complete, Failed
  const status = task?.status || 'Queued';

  useEffect(() => {
    let interval;
    if (status === 'Queued' || status === 'In Progress') {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          return prev + (prev < 50 ? 5 : 2); // Faster at start, slower as it nears 100%
        });
      }, 1000);
    } else if (status === 'Complete') {
      setProgress(100);
      queryClient.invalidateQueries(['documents', leadId]);
      if (onComplete) onComplete();
    } else if (status === 'Failed') {
      // Keep progress where it was or show error state
    }

    return () => clearInterval(interval);
  }, [status, leadId, queryClient, onComplete]);

  const steps = [
    { label: "Fetching lead and division data...", active: status === 'Queued', completed: status !== 'Queued' },
    { label: "Generating document content...", active: status === 'In Progress' && progress < 40, completed: progress >= 40 || status === 'Complete' },
    { label: "Uploading to S3...", active: status === 'In Progress' && progress >= 40 && progress < 70, completed: progress >= 70 || status === 'Complete' },
    { label: "Syncing to SharePoint...", active: status === 'In Progress' && progress >= 70 && progress < 90, completed: progress >= 90 || status === 'Complete' },
    { label: "Saving document record...", active: status === 'In Progress' && progress >= 90, completed: status === 'Complete' },
  ];

  const isFinished = status === 'Complete' || status === 'Failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
            Document Generation
            {isFinished ? (
              status === 'Complete' ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />
            ) : (
              <FiLoader className="text-blue-600 animate-spin" />
            )}
          </h3>

          {/* Progress Bar */}
          <div className="relative h-3 bg-gray-100 rounded-full mb-8 overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                status === 'Failed' ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps List */}
          <div className="space-y-4 mb-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                  step.completed 
                    ? "bg-green-100 border-green-500 text-green-600" 
                    : step.active 
                      ? "bg-blue-50 border-blue-500 text-blue-600" 
                      : "bg-gray-50 border-gray-200 text-gray-400"
                }`}>
                  {step.completed ? (
                    <FiCheckCircle size={14} />
                  ) : step.active ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={`${
                  step.completed ? "text-gray-900 font-medium" : step.active ? "text-blue-700 font-medium" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {isFinished && (
            <div className="flex flex-col space-y-3">
              {status === 'Complete' ? (
                <>
                  <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-green-800 text-sm mb-2">
                    ✅ Document ready! You can now download it or view it in SharePoint.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => downloadDocument(documentId)}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <FiDownload />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <span>Done</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 text-sm mb-2">
                    ❌ Generation failed. {task?.error || "Please try again later."}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
                  >
                    <span>Back & Retry</span>
                    <FiArrowRight />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressModal;
