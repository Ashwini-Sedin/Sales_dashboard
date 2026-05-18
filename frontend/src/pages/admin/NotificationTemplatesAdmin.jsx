import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    ArrowPathIcon,
    DevicePhoneMobileIcon,
    ComputerDesktopIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const NotificationTemplatesAdmin = () => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({ subject: '', body_html: '' });

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/notifications/templates');
            setTemplates(response.data);
            if (response.data.length > 0 && !selectedTemplate) {
                handleSelectTemplate(response.data[0]);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setEditData({
            subject: template.subject,
            body_html: template.body_html
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.put(`/api/notifications/templates/${selectedTemplate.id}`, editData);
            setTemplates(templates.map(t => t.id === selectedTemplate.id ? { ...t, ...editData } : t));
            alert('Template updated successfully');
        } catch (error) {
            console.error('Error saving template:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notification Templates</h1>
                    <p className="text-gray-500 mt-1">Customize system emails and notifications.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
                {/* Templates List */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Events</span>
                        <button onClick={fetchTemplates} className="text-gray-400 hover:text-indigo-600">
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                        {templates.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className={`w-full px-6 py-5 text-left flex items-center justify-between group transition-colors ${selectedTemplate?.id === t.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : 'hover:bg-gray-50'}`}
                            >
                                <div>
                                    <h3 className={`font-bold text-sm ${selectedTemplate?.id === t.id ? 'text-indigo-700' : 'text-gray-900'}`}>{t.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.subject}</p>
                                </div>
                                <ChevronRightIcon className={`w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors ${selectedTemplate?.id === t.id ? 'text-indigo-500' : ''}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor & Preview */}
                <div className="lg:col-span-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
                    {/* Editor */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-50">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Editor</span>
                        </div>
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject Line</label>
                                <input
                                    value={editData.subject}
                                    onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">HTML Body</label>
                                <textarea
                                    value={editData.body_html}
                                    onChange={(e) => setEditData({ ...editData, body_html: e.target.value })}
                                    className="flex-1 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none min-h-[300px]"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-50 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-sm shadow-lg shadow-indigo-100 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-100 rounded-2xl shadow-inner border border-gray-200 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="flex gap-3 text-gray-400">
                                <ComputerDesktopIcon className="w-4 h-4 text-indigo-600" />
                                <DevicePhoneMobileIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="bg-white m-4 rounded-lg shadow-sm flex-1 overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50">
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Subject</div>
                                <div className="text-sm font-semibold text-gray-700">{editData.subject}</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-white">
                                <div dangerouslySetInnerHTML={{ __html: editData.body_html }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationTemplatesAdmin;
