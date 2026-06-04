import React, { useState, useEffect } from 'react';
import { FiMail, FiPhoneCall, FiCalendar, FiClock, FiUser, FiInfo } from 'react-icons/fi';
import axiosInstance from '../api/axios';
import { format } from 'date-fns';

const CommunicationHub = () => {
  const [activeTab, setActiveTab] = useState('emails');
  const [emails, setEmails] = useState([]);
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'emails') {
        const response = await axiosInstance.get('/api/communications/emails');
        setEmails(response.data.items || []);
      } else {
        const response = await axiosInstance.get('/api/communications/calls');
        setCalls(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Communication Hub</h1>
        <p className="text-slate-500 text-sm">View and manage all your global emails and call recordings across leads.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-4 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex items-center gap-2 pb-4 px-4 font-medium transition-all ${
              activeTab === 'emails' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiMail className={activeTab === 'emails' ? 'animate-pulse' : ''} />
            Emails
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 pb-4 px-4 font-medium transition-all ${
              activeTab === 'calls' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiPhoneCall className={activeTab === 'calls' ? 'animate-pulse' : ''} />
            Call Recordings
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 bg-slate-50/30 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'emails' && (
                emails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-100">
                      <FiMail className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600 text-lg">No emails found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div key={email.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
                            {getInitials(email.sender_name || email.sender_email)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-800 truncate pr-4">{email.subject || '(No Subject)'}</h4>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1 shrink-0">
                              <FiClock />
                              {format(new Date(email.received_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-600 mb-2">From: {email.sender_name || email.sender_email}</p>
                          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                            {email.body_preview || 'No preview available'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeTab === 'calls' && (
                calls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-100">
                      <FiPhoneCall className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600 text-lg">No call recordings found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calls.map((call) => (
                      <div key={call.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <FiPhoneCall className="w-16 h-16 text-indigo-600" />
                        </div>
                        <div className="mb-4 z-10">
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full font-semibold border border-indigo-100">
                            <FiInfo /> Call Recording
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-2 z-10">{call.filename || 'Unknown Call'}</h4>
                        <div className="flex flex-col gap-2 mt-auto z-10 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <FiClock className="text-slate-400" /> 
                            <span>{Math.floor((call.duration_seconds || 0) / 60)}m {(call.duration_seconds || 0) % 60}s</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-slate-400" /> 
                            <span>{format(new Date(call.recorded_at), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(call.participants || []).slice(0, 3).map((p, i) => (
                              <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                <FiUser className="w-3 h-3" /> {p.name || p.email}
                              </span>
                            ))}
                            {(call.participants || []).length > 3 && (
                              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">
                                +{(call.participants.length - 3)} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub;
