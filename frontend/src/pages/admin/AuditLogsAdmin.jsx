import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    ArrowDownTrayIcon, 
    FunnelIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    UserIcon,
    TagIcon
} from '@heroicons/react/24/outline';

const AuditLogsAdmin = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        user_id: '',
        action: '',
        start_date: '',
        end_date: ''
    });
    const [page, setPage] = useState(0);
    const limit = 50;

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                skip: page * limit,
                limit: limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            };
            const response = await axios.get('/api/audit-logs', { params });
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const handleExport = async () => {
        try {
            const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await axios.get('/api/audit-logs/export', { 
                params,
                responseType: 'blob' 
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                    <p className="text-gray-500 mt-1">Track system activity and user actions.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-semibold"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Action</label>
                    <div className="relative">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select 
                            value={filters.action}
                            onChange={(e) => setFilters({...filters, action: e.target.value})}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm appearance-none"
                        >
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="login">Login</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Date Range</label>
                    <div className="flex gap-2">
                        <input 
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
                        />
                        <input 
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm"
                        />
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setFilters({user_id: '', action: '', start_date: '', end_date: ''});
                        setPage(0);
                    }}
                    className="px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50 rounded-xl transition-colors"
                >
                    Reset
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading audit logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">No logs found matching filters.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-2">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{log.user_email || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                                log.action === 'create' ? 'bg-green-50 text-green-700 border-green-100' :
                                                log.action === 'update' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                log.action === 'delete' ? 'bg-red-50 text-red-700 border-red-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">{log.entity_type}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">{log.entity_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs text-xs text-gray-500 truncate" title={JSON.stringify(log.new_value)}>
                                                {log.new_value ? JSON.stringify(log.new_value) : 'No details'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <button 
                        disabled={page === 0}
                        onClick={() => setPage(page - 1)}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 disabled:text-gray-300 transition-colors"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page + 1}</span>
                    <button 
                        disabled={logs.length < limit}
                        onClick={() => setPage(page + 1)}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 disabled:text-gray-300 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsAdmin;
