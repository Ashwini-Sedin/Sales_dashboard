import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
    PlusIcon, 
    PencilSquareIcon, 
    UsersIcon, 
    BriefcaseIcon, 
    ChevronRightIcon 
} from '@heroicons/react/24/outline';
import CreateDivisionModal from '../../components/admin/CreateDivisionModal';

const DivisionsAdmin = () => {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState(null);

    const fetchDivisions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/divisions');
            setDivisions(response.data);
        } catch (error) {
            console.error('Error fetching divisions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDivisions();
    }, []);

    const handleEdit = (division) => {
        setSelectedDivision(division);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setSelectedDivision(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                        type="text" 
                        placeholder="Search divisions..." 
                        className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-xl bg-white dark:bg-[#141a21] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ebf99] w-full sm:w-64"
                    />
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-[#0ebf99] text-white rounded-xl hover:bg-opacity-90 transition-colors shadow-sm text-sm font-bold gap-2 whitespace-nowrap"
                >
                    <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
                    Add Division
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#141a21] rounded-2xl border border-gray-100 dark:border-df-border p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-[#10151b] rounded-xl" />
                                <div className="w-8 h-8 bg-gray-100 dark:bg-[#10151b] rounded-lg" />
                            </div>
                            <div className="h-6 bg-gray-100 dark:bg-[#10151b] rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-100 dark:bg-[#10151b] rounded w-1/2 mb-6" />
                            <div className="flex gap-4">
                                <div className="h-4 bg-gray-100 dark:bg-[#10151b] rounded w-1/4" />
                                <div className="h-4 bg-gray-100 dark:bg-[#10151b] rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {divisions.map((division) => (
                        <div key={division.id} className="bg-white dark:bg-[#141a21] rounded-xl border border-gray-100 dark:border-df-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div 
                                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/10"
                                        style={{ backgroundColor: division.primary_color || '#0ebf99' }}
                                    >
                                        {division.logo_url ? (
                                            <img src={division.logo_url} alt={division.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            division.name?.[0].toUpperCase()
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleEdit(division)}
                                        className="p-2 text-gray-400 hover:text-[#0ebf99] hover:bg-[#e5faef] dark:hover:bg-[#10151b] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{division.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: division.secondary_color || '#818cf8' }} />
                                    {division.head_user_name || 'No Head Assigned'}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-[#10151b] rounded-xl p-3 border border-gray-100 dark:border-df-border">
                                        <div className="flex items-center text-gray-400 dark:text-gray-500 mb-1">
                                            <UsersIcon className="w-4 h-4 mr-1.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Team</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">{division.user_count || 0}</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#10151b] rounded-xl p-3 border border-gray-100 dark:border-df-border">
                                        <div className="flex items-center text-gray-400 dark:text-gray-500 mb-1">
                                            <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Leads</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">{division.lead_count || 0}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-gray-50 dark:bg-[#10151b] border-t border-gray-100 dark:border-df-border flex items-center justify-between group-hover:bg-[#e5faef] dark:group-hover:bg-[#0ebf99]/10 transition-colors">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-[#0ebf99] dark:group-hover:text-[#0ebf99] uppercase tracking-wider transition-colors">View Details</span>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#0ebf99] dark:group-hover:text-[#0ebf99] transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <CreateDivisionModal 
                    isOpen={isCreateModalOpen} 
                    division={selectedDivision}
                    onClose={handleCloseModal} 
                    onSuccess={fetchDivisions}
                />
            )}
        </div>
    );
};

export default DivisionsAdmin;
