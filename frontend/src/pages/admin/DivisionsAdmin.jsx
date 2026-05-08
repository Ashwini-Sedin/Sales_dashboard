import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
            const response = await axios.get('/api/divisions');
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Divisions</h1>
                    <p className="text-gray-500 mt-1">Manage business units, branding, and heads.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm font-semibold"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Division
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                                <div className="w-8 h-8 bg-gray-100 rounded-lg" />
                            </div>
                            <div className="h-6 bg-gray-100 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
                            <div className="flex gap-4">
                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                                <div className="h-4 bg-gray-100 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {divisions.map((division) => (
                        <div key={division.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                                        style={{ backgroundColor: division.primary_color || '#4f46e5' }}
                                    >
                                        {division.logo_url ? (
                                            <img src={division.logo_url} alt={division.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            division.name?.[0].toUpperCase()
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => handleEdit(division)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1">{division.name}</h3>
                                <div className="flex items-center text-sm text-gray-500 mb-6">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: division.secondary_color || '#818cf8' }} />
                                    {division.head_user_name || 'No Head Assigned'}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center text-gray-400 mb-1">
                                            <UsersIcon className="w-4 h-4 mr-1.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Team</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">{division.user_count || 0}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <div className="flex items-center text-gray-400 mb-1">
                                            <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Leads</span>
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">{division.lead_count || 0}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-indigo-50 transition-colors">
                                <span className="text-xs font-semibold text-gray-500 group-hover:text-indigo-600 uppercase tracking-wider transition-colors">View Details</span>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
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
