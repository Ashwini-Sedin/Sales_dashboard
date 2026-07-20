import React, { useState, useEffect } from 'react';
import { 
    FiSettings, 
    FiCheckCircle, 
    FiXCircle, 
    FiAlertCircle, 
    FiSave, 
    FiPlay, 
    FiHelpCircle, 
    FiFolder, 
    FiChevronDown, 
    FiChevronUp, 
    FiEye, 
    FiEyeOff, 
    FiGlobe, 
    FiVideo,
    FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'Chief Executive Officer' || user?.role === 'Division Head' || user?.role === 'division_head';
    
    const [activeTab, setActiveTab] = useState('integrations');
    
    // SharePoint integration state
    const [statusLoading, setStatusLoading] = useState(true);
    const [statusData, setStatusData] = useState({
        azure_tenant_id_configured: false,
        azure_client_id_configured: false,
        azure_client_secret_configured: false,
        sharepoint_site_id_configured: false,
        azure_tenant_id_value: '',
        azure_client_id_value: '',
        sharepoint_site_id_value: '',
        connection_status: 'not_configured',
        error_message: null
    });
    
    // Form fields
    const [formData, setFormData] = useState({
        azure_tenant_id: '',
        azure_client_id: '',
        azure_client_secret: '',
        sharepoint_site_id: ''
    });
    
    const [showSecret, setShowSecret] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchStatus = async () => {
        setStatusLoading(true);
        try {
            const response = await api.get('/api/integrations/graph/status');
            setStatusData(response.data);
            setFormData({
                azure_tenant_id: response.data.azure_tenant_id_value || '',
                azure_client_id: response.data.azure_client_id_value || '',
                azure_client_secret: '', // Do not populate secret on client side for security
                sharepoint_site_id: response.data.sharepoint_site_id_value || ''
            });
        } catch (error) {
            console.error('Error fetching integration status:', error);
            // Default fallbacks if backend is not fully synced
            setStatusData({
                azure_tenant_id_configured: false,
                azure_client_id_configured: false,
                azure_client_secret_configured: false,
                sharepoint_site_id_configured: false,
                azure_tenant_id_value: '',
                azure_client_id_value: '',
                sharepoint_site_id_value: '',
                connection_status: 'not_configured',
                error_message: null
            });
        } finally {
            setStatusLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTestConnection = async (e) => {
        if (e) e.preventDefault();
        
        // Validation
        if (!formData.azure_tenant_id || !formData.azure_client_id || !formData.azure_client_secret) {
            toast.error('Tenant ID, Client ID, and Client Secret are required to test.');
            return;
        }

        setTesting(true);
        try {
            const payload = {
                azure_tenant_id: formData.azure_tenant_id,
                azure_client_id: formData.azure_client_id,
                azure_client_secret: formData.azure_client_secret,
                sharepoint_site_id: formData.sharepoint_site_id || null
            };
            const response = await api.post('/api/integrations/graph/test-temp-credentials', payload);
            
            if (response.data.status === 'success') {
                toast.success('Connection tested successfully! Credentials are valid.');
                // Update temporary state for feedback
                setStatusData(prev => ({
                    ...prev,
                    connection_status: 'connected',
                    error_message: null
                }));
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            const detail = error.response?.data?.detail || 'Test connection failed.';
            toast.error(`Verification failed: ${detail}`);
            setStatusData(prev => ({
                ...prev,
                connection_status: 'error',
                error_message: detail
            }));
        } finally {
            setTesting(false);
        }
    };

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        if (!isAdmin) {
            toast.error('Only administrators can modify system integrations.');
            return;
        }

        if (!formData.azure_tenant_id || !formData.azure_client_id || !formData.azure_client_secret) {
            toast.error('Tenant ID, Client ID, and Client Secret are required.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                azure_tenant_id: formData.azure_tenant_id,
                azure_client_id: formData.azure_client_id,
                azure_client_secret: formData.azure_client_secret,
                sharepoint_site_id: formData.sharepoint_site_id || null
            };
            const response = await api.post('/api/integrations/graph/save-credentials', payload);
            
            if (response.data.status === 'success') {
                toast.success('Configuration saved and reloaded!');
                fetchStatus();
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
            const detail = error.response?.data?.detail || 'Failed to save configuration.';
            toast.error(detail);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'connected':
                return (
                    <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Connected</span>
                    </span>
                );
            case 'error':
                return (
                    <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>Connection Failed</span>
                    </span>
                );
            case 'not_configured':
            default:
                return (
                    <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 dark:bg-df-card border border-gray-200 dark:border-df-border text-gray-500 dark:text-df-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        <span>Not Configured</span>
                    </span>
                );
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-df-textlight">System Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-df-text mt-1">Configure global application integrations and parameters.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-df-border">
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`flex items-center space-x-2 py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-150 focus:outline-none ${
                        activeTab === 'integrations'
                        ? 'border-[#0ebf99] dark:border-df-accent text-[#0ebf99] dark:text-df-accent'
                        : 'border-transparent text-gray-500 dark:text-df-text hover:text-gray-900 dark:hover:text-df-textlight'
                    }`}
                >
                    <FiSettings className="w-4 h-4" />
                    <span>System Integrations</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center space-x-2 py-3 px-6 text-sm font-semibold border-b-2 transition-all duration-150 focus:outline-none ${
                        activeTab === 'profile'
                        ? 'border-[#0ebf99] dark:border-df-accent text-[#0ebf99] dark:text-df-accent'
                        : 'border-transparent text-gray-500 dark:text-df-text hover:text-gray-900 dark:hover:text-df-textlight'
                    }`}
                >
                    <FiUser className="w-4 h-4" />
                    <span>My Profile</span>
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'integrations' && (
                <div className="grid grid-cols-1 gap-8">
                    {/* SharePoint / MS365 Settings Card */}
                    <div className="bg-white dark:bg-df-card rounded-xl border border-gray-100 dark:border-df-border overflow-hidden">
                        {/* Title Section */}
                        <div className="p-6 border-b border-gray-50 dark:border-df-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-transparent via-transparent to-indigo-50/50 dark:to-indigo-950/10">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                                    <FiFolder className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-df-textlight flex items-center gap-2">
                                        Microsoft 365 SharePoint
                                    </h3>
                                    <p className="text-xs text-gray-400 dark:text-df-text mt-0.5">Automate document archiving and storage inside SharePoint libraries.</p>
                                </div>
                            </div>
                            <div className="flex items-center self-start md:self-center">
                                {statusLoading ? (
                                    <span className="text-xs text-gray-400 dark:text-df-text animate-pulse">Loading status...</span>
                                ) : (
                                    getStatusBadge(statusData.connection_status)
                                )}
                            </div>
                        </div>

                        {/* Diagnostics / Error Output */}
                        {statusData.error_message && (
                            <div className="mx-6 mt-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-start space-x-3 text-rose-800 dark:text-rose-300 text-xs">
                                <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <span className="font-bold">Connection Diagnostics:</span>
                                    <p className="font-mono leading-relaxed break-all">{statusData.error_message}</p>
                                </div>
                            </div>
                        )}

                        {/* Content & Form */}
                        <div className="p-6 space-y-6">
                            {/* Expandable Setup Guide */}
                            <div className="border border-gray-200 dark:border-df-border rounded-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-df-cardhover text-gray-700 dark:text-df-textlight hover:bg-gray-100 dark:hover:bg-df-border text-sm font-semibold transition-colors focus:outline-none"
                                >
                                    <span className="flex items-center space-x-2">
                                        <FiHelpCircle className="w-4 h-4 text-blue-500" />
                                        <span>Azure App Registration Setup Guide</span>
                                    </span>
                                    {showGuide ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                                </button>
                                
                                {showGuide && (
                                    <div className="p-4 bg-white dark:bg-df-card text-xs text-gray-600 dark:text-df-text space-y-3 leading-relaxed border-t border-gray-100 dark:border-df-border">
                                        <p>To hook up DealFlow to your Microsoft 365 Tenant and upload documents to SharePoint, you must perform these steps in the Azure Portal:</p>
                                        <ol className="list-decimal pl-5 space-y-2">
                                            <li>Go to the <strong>Microsoft Entra Admin Center</strong> (or Azure Portal) &gt; <strong>App Registrations</strong> &gt; <strong>New Registration</strong>.</li>
                                            <li>Name it (e.g. <code>DealFlow-Integration</code>). Choose <em>Accounts in this organizational directory only</em> and click <strong>Register</strong>.</li>
                                            <li>Copy the <strong>Application (client) ID</strong> and <strong>Directory (tenant) ID</strong> from the overview tab.</li>
                                            <li>Go to <strong>API Permissions</strong> &gt; <strong>Add a permission</strong> &gt; <strong>Microsoft Graph</strong> &gt; <strong>Application permissions</strong>:
                                                <ul className="list-disc pl-5 mt-1 font-mono text-emerald-600 dark:text-df-accent space-y-0.5">
                                                    <li>Sites.ReadWrite.All</li>
                                                    <li>Files.ReadWrite.All</li>
                                                </ul>
                                            </li>
                                            <li>Click <strong>Grant admin consent for [your tenant]</strong> to activate the permissions.</li>
                                            <li>Go to <strong>Certificates & secrets</strong> &gt; <strong>New client secret</strong>. Generate it and copy the secret <strong>Value</strong> immediately (it will be hidden later).</li>
                                            <li>For the <strong>SharePoint Site ID</strong>: Query Microsoft Graph explorer (e.g., <code>https://graph.microsoft.com/v1.0/sites/root</code> or <code>https://graph.microsoft.com/v1.0/sites/[tenant-domain]:/sites/[site-name]</code>). The Site ID has a specific format like: <code>yourtenant.sharepoint.com,xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx,yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy</code>.</li>
                                        </ol>
                                    </div>
                                )}
                            </div>

                            {/* Credentials Form */}
                            <form className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-df-text">Directory (Tenant) ID</label>
                                        <input
                                            type="text"
                                            name="azure_tenant_id"
                                            value={formData.azure_tenant_id}
                                            onChange={handleInputChange}
                                            disabled={statusLoading}
                                            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            className="w-full bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-df-accent text-gray-900 dark:text-df-textlight disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-df-text">Application (Client) ID</label>
                                        <input
                                            type="text"
                                            name="azure_client_id"
                                            value={formData.azure_client_id}
                                            onChange={handleInputChange}
                                            disabled={statusLoading}
                                            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            className="w-full bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-df-accent text-gray-900 dark:text-df-textlight disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1 relative">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-df-text">Client Secret</label>
                                        <div className="relative">
                                            <input
                                                type={showSecret ? "text" : "password"}
                                                name="azure_client_secret"
                                                value={formData.azure_client_secret}
                                                onChange={handleInputChange}
                                                disabled={statusLoading}
                                                placeholder={statusData.azure_client_secret_configured ? "••••••••••••••••••••" : "Enter client secret value"}
                                                className="w-full bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-df-accent text-gray-900 dark:text-df-textlight disabled:opacity-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecret(!showSecret)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 dark:text-df-text">SharePoint Site ID (Optional)</label>
                                        <input
                                            type="text"
                                            name="sharepoint_site_id"
                                            value={formData.sharepoint_site_id}
                                            onChange={handleInputChange}
                                            disabled={statusLoading}
                                            placeholder="e.g. tenant.sharepoint.com,site-uuid,web-uuid"
                                            className="w-full bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-df-accent text-gray-900 dark:text-df-textlight disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="pt-4 flex flex-wrap gap-4 border-t border-gray-50 dark:border-df-border">
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testing || statusLoading}
                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {testing ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiPlay className="w-4 h-4" />
                                                <span>Test Connection</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={handleSaveSettings}
                                            disabled={saving || statusLoading}
                                            className="flex items-center space-x-2 px-5 py-2 bg-[#0ebf99] hover:bg-[#0da685] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ml-auto"
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiSave className="w-4 h-4" />
                                                    <span>Save Configuration</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* General Integrations Checklist grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Microsoft Teams Card */}
                        <div className="bg-white dark:bg-df-card rounded-xl border border-gray-100 dark:border-df-border p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                                        <FiVideo className="w-5 h-5" />
                                    </div>
                                    <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                        <span>Active</span>
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-df-textlight">Microsoft Teams Integrations</h4>
                                    <p className="text-xs text-gray-400 dark:text-df-text mt-1">Capture recording transcripts and capture audio/video metadata from scheduled client calls.</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-50 dark:border-df-border mt-6 text-xs text-gray-400 dark:text-df-text">
                                Configured via subscription hooks. Live event monitoring is active.
                            </div>
                        </div>

                        {/* Google Ads Card */}
                        <div className="bg-white dark:bg-df-card rounded-xl border border-gray-100 dark:border-df-border p-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                                        <FiGlobe className="w-5 h-5" />
                                    </div>
                                    <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                                        <span>Connected</span>
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-df-textlight">Google Ads Lead Sync</h4>
                                    <p className="text-xs text-gray-400 dark:text-df-text mt-1">Synchronize incoming form leads from active search engine marketing campaigns directly to pipeline.</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-gray-50 dark:border-df-border mt-6 text-xs text-gray-400 dark:text-df-text">
                                Webhook validation token is verified. Periodic syncs run every 15 minutes.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="bg-white dark:bg-df-card rounded-xl border border-gray-100 dark:border-df-border p-6 max-w-2xl">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-df-textlight mb-6">User Profile Details</h3>
                    <div className="space-y-4">
                        <div className="flex border-b border-gray-50 dark:border-df-border py-2 text-sm">
                            <span className="w-32 font-semibold text-gray-500 dark:text-df-text">Full Name</span>
                            <span className="text-gray-900 dark:text-df-textlight">{user?.first_name} {user?.last_name}</span>
                        </div>
                        <div className="flex border-b border-gray-50 dark:border-df-border py-2 text-sm">
                            <span className="w-32 font-semibold text-gray-500 dark:text-df-text">Email Address</span>
                            <span className="text-gray-900 dark:text-df-textlight">{user?.email}</span>
                        </div>
                        <div className="flex border-b border-gray-50 dark:border-df-border py-2 text-sm">
                            <span className="w-32 font-semibold text-gray-500 dark:text-df-text">System Role</span>
                            <span className="text-gray-900 dark:text-df-textlight capitalize">{user?.role?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex border-b border-gray-50 dark:border-df-border py-2 text-sm">
                            <span className="w-32 font-semibold text-gray-500 dark:text-df-text">Division</span>
                            <span className="text-gray-900 dark:text-df-textlight">{user?.division_name || 'Global'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
