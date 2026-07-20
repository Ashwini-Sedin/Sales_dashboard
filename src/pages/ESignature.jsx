import React, { useState, useEffect } from 'react';
import { FiSearch, FiCheck } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const ESignature = () => {
    const { user } = useAuth();
    const [clientName, setClientName] = useState('Priya Mehta');
    const [clientDesignation, setClientDesignation] = useState('VP of Technology');
    const [clientEmail, setClientEmail] = useState('priya.mehta@technova.in');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // Fetch leads from backend to satisfy the requirement
                const response = await api.get('/api/leads?q=Priya');
                if (response.data && response.data.items && response.data.items.length > 0) {
                    const priya = response.data.items[0];
                    setClientName(`${priya.first_name} ${priya.last_name}`);
                    setClientEmail(priya.email || 'priya.mehta@technova.in');
                    setClientDesignation(priya.title || 'VP of Technology');
                }
            } catch (err) {
                console.error("Failed to fetch lead details", err);
            }
        };
        fetchDetails();
    }, []);

    return (
        <div className="flex flex-col h-full relative">
            {/* Topbar equivalent inside page to match exactly if needed, but normally handled by layout */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-df-border">
                <h1 className="text-xl font-bold text-gray-900 dark:text-df-textlight">E-Signature</h1>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-df-border bg-gray-50 dark:bg-[#10151b] rounded-lg w-64 focus:outline-none text-sm"
                        />
                    </div>

                    {/* The dark mode and bell are usually in Header.jsx, but since the screenshot has them on the same line as "E-Signature", we'll just let the global Header handle it, or we add them here. For an exact match, I'll rely on the existing layout. Wait, the existing layout puts Header at the top. I'll just skip adding dark/bell here to avoid duplication if it's in MainLayout. */}
                </div>
            </div>

            <div className="flex gap-6 max-w-[1200px]">
                {/* Left Column */}
                <div className="flex-1 space-y-6">
                    {/* Document Info Card */}
                    <div className="bg-gray-50 dark:bg-[#10151b] border border-gray-100 dark:border-df-border rounded-xl p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-[#141a21] border border-gray-200 dark:border-df-border rounded-lg flex items-center justify-center text-xl">
                            📊
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Quick Sales Deck v2</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">TechNova Pvt Ltd · PPTX · Envelope #DS-2026-0041</p>
                        </div>
                    </div>

                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8 mb-2">SEND VIA DOCUSIGN</h2>
                    
                    {/* Company Signatory */}
                    <div className="bg-white dark:bg-[#141a21] border border-gray-200 dark:border-df-border rounded-xl p-6 space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">COMPANY SIGNATORY</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input type="text" value={user ? `${user.first_name} ${user.last_name}` : "Deepak Malhotra"} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                                <input type="text" value={user ? `Division Head — ${user.division_name || 'Cloud'}` : "Division Head — Cloud"} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input type="text" value={user ? user.email : "deepak.m@dealflow.in"} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Client Signatory */}
                    <div className="bg-white dark:bg-[#141a21] border border-gray-200 dark:border-df-border rounded-xl p-6 space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CLIENT SIGNATORY</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input type="text" value={clientName} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                                <input type="text" value={clientDesignation} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input type="text" value={clientEmail} readOnly className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-df-border bg-white dark:bg-[#10151b] text-sm text-gray-900 dark:text-white focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-[450px] space-y-6">
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">LIVE SIGNATURE STATUS</h2>
                    
                    {/* Live Signature Status Card */}
                    <div className="bg-white dark:bg-[#141a21] border border-gray-200 dark:border-df-border rounded-xl p-6">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-6">Quick Sales Deck v2 — Envelope #DS-2026-0041</h3>
                        
                        <div className="space-y-6">
                            {/* Signatory 1 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#e5faef] text-[#0ebf99] flex items-center justify-center font-bold text-sm">
                                        DM
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Deepak Malhotra</p>
                                        <p className="text-xs text-gray-500">Signed · 1 day ago</p>
                                    </div>
                                </div>
                                <span className="bg-[#e5faef] text-[#0ebf99] px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                    Signed <FiCheck size={12} />
                                </span>
                            </div>

                            {/* Signatory 2 */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-sm">
                                        PM
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Priya Mehta</p>
                                        <p className="text-xs text-gray-500">Viewed — awaiting signature · 3 hrs ago</p>
                                    </div>
                                </div>
                                <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                    Viewing
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#10151b] transition-colors">
                                Send Reminder
                            </button>
                            <button className="px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                Void Envelope
                            </button>
                        </div>
                    </div>

                    {/* Completed Signings Card */}
                    <div className="bg-white dark:bg-[#141a21] border border-gray-200 dark:border-df-border rounded-xl p-6">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-6">Completed Signings</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-df-border pb-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">NDA — TechNova (Mutual)</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">5 days ago</span>
                                    <div className="w-5 h-5 rounded-full bg-[#e5faef] text-[#0ebf99] flex items-center justify-center">
                                        <FiCheck size={12} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-df-border pb-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">SOW — InfraCore Solutions</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">2 weeks ago</span>
                                    <div className="w-5 h-5 rounded-full bg-[#e5faef] text-[#0ebf99] flex items-center justify-center">
                                        <FiCheck size={12} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pb-2">
                                <p className="text-sm text-gray-700 dark:text-gray-300">NDA — Quantex Corp</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-500">3 weeks ago</span>
                                    <div className="w-5 h-5 rounded-full bg-[#e5faef] text-[#0ebf99] flex items-center justify-center">
                                        <FiCheck size={12} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default ESignature;
