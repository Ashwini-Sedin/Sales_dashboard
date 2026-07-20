import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdClose, MdDownload, MdPlayArrow, MdPause } from 'react-icons/md';
import axiosInstance from '../../api/axios';

const CallDetailModal = ({ call, leadId, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = React.useRef(null);

  const { data: playbackUrl, isLoading } = useQuery({
    queryKey: ['callPlayback', call.id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/leads/${leadId}/calls/${call.id}/playback-url`
      );
      return response.data.playback_url;
    },
  });

  const handleDownload = async () => {
    if (playbackUrl) {
      const link = document.createElement('a');
      link.href = playbackUrl;
      link.download = call.filename || 'recording.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-800">Call Recording</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MdClose className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Recording Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Recording Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">File Name</p>
                <p className="font-medium text-slate-800 break-all">{call.filename || 'Recording'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Duration</p>
                <p className="font-medium text-slate-800">{formatDuration(call.duration_seconds)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Recorded On</p>
                <p className="font-medium text-slate-800">{formatDate(call.recorded_at)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">File Size</p>
                <p className="font-medium text-slate-800">
                  {(call.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 mb-4">Playback</h3>
            <div className="bg-slate-50 rounded-lg p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : playbackUrl ? (
                <div className="space-y-4">
                  <audio
                    ref={audioRef}
                    src={playbackUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    className="w-full"
                    controls
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          audioRef.current?.play();
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      {isPlaying ? (
                        <>
                          <MdPause className="w-5 h-5" /> Pause
                        </>
                      ) : (
                        <>
                          <MdPlayArrow className="w-5 h-5" /> Play
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      <MdDownload className="w-5 h-5" /> Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Unable to load playback URL</p>
                </div>
              )}
            </div>
          </div>

          {/* Transcription */}
          {call.transcription_text && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-800 mb-4">Transcription</h3>
              <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {call.transcription_text}
                </p>
              </div>
            </div>
          )}

          {/* Participants */}
          {call.participants && call.participants.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Participants</h3>
              <div className="space-y-2">
                {call.participants.map((participant, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-600 flex items-center justify-center text-sm font-medium">
                      {participant.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {participant.name || 'Unknown'}
                      </p>
                      {participant.email && (
                        <p className="text-xs text-slate-500">{participant.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDetailModal;
