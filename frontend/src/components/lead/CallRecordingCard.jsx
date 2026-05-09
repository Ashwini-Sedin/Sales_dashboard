import React, { useState } from 'react';
import { format } from 'date-fns';
import { FiClock, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { usePlaybackUrl } from '../../hooks/useCallRecordings';

const CallRecordingCard = ({ recording, leadId }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const { data: playbackData, isLoading: isLoadingUrl } = usePlaybackUrl(leadId, recording.id);

  const formatSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const isVideo = recording.filename?.toLowerCase().endsWith('.mp4');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="font-medium text-gray-900">
          {recording.recorded_at && format(new Date(recording.recorded_at), 'dd MMM yyyy, hh:mm a')}
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {formatSize(recording.file_size_bytes)}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-500 mr-2">Participants:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {recording.participants && recording.participants.length > 0 ? (
            recording.participants.map((p, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {p.name || p.email || 'Unknown User'}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 italic">No participants info</span>
          )}
        </div>
      </div>

      <div className="mb-4 bg-gray-50 rounded p-2 border border-gray-100 flex justify-center">
        {isLoadingUrl ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : playbackData?.playback_url ? (
          isVideo ? (
            <video 
              controls 
              src={playbackData.playback_url} 
              className="w-full max-h-64 rounded bg-black"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <audio controls src={playbackData.playback_url} className="w-full">
              Your browser does not support the audio element.
            </audio>
          )
        ) : (
          <div className="py-4 text-gray-400 text-sm">Preview not available</div>
        )}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-4">
        <FiClock className="mr-1.5" />
        {formatDuration(recording.duration_seconds)}
      </div>

      <div className="border-t border-gray-100 pt-3">
        <button 
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-blue-600 mb-2 transition-colors"
        >
          <span>{showTranscript ? 'Hide Transcription' : 'Show Transcription'}</span>
          {showTranscript ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        
        {showTranscript && (
          <div className="mb-3">
            {!recording.transcription_text ? (
              <p className="text-gray-400 italic text-sm p-3 bg-gray-50 rounded">Transcription not available</p>
            ) : (
              <div className="p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto border border-gray-100">
                {recording.transcription_text}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={() => {
            if (playbackData?.playback_url) {
              window.open(playbackData.playback_url, '_blank');
            }
          }}
          disabled={!playbackData?.playback_url}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <FiDownload /> Download Recording
        </button>
      </div>
    </div>
  );
};

export default CallRecordingCard;
