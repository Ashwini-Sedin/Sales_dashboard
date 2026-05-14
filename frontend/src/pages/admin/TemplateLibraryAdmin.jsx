import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FiLayout, FiUpload, FiTrash2, FiCheck, 
  FiMoreVertical, FiClock, FiGrid, FiList,
  FiFilter, FiDownload
} from 'react-icons/fi';
import api from '../../api';
import { toast } from 'react-hot-toast';
import UploadTemplateModal from '../../components/admin/UploadTemplateModal';
import { format } from 'date-fns';

const TemplateLibraryAdmin = () => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Filters
  const [divisionFilter, setDivisionFilter] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const res = await api.get('/api/divisions');
      return res.data;
    }
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', divisionFilter, docTypeFilter, formatFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (divisionFilter) params.append('division_id', divisionFilter);
      if (docTypeFilter) params.append('doc_type', docTypeFilter);
      if (formatFilter) params.append('format', formatFilter);
      
      const res = await api.get(`/api/templates?${params.toString()}`);
      return res.data;
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (templateId) => {
      const res = await api.put(`/api/templates/${templateId}/activate`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template activated successfully');
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to activate template');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (templateId) => {
      const res = await api.delete(`/api/templates/${templateId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete template');
    }
  });

  const getDocTypeBadge = (type) => {
    const types = {
      quick_sales: { label: 'Quick Sales', color: 'bg-yellow-100 text-yellow-700' },
      detailed_proposal: { label: 'Detailed Proposal', color: 'bg-blue-100 text-blue-700' },
      presales: { label: 'Presales', color: 'bg-purple-100 text-purple-700' },
      nda: { label: 'NDA', color: 'bg-red-100 text-red-700' },
      sow: { label: 'SOW', color: 'bg-green-100 text-green-700' }
    };
    const config = types[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${config.color}`}>{config.label}</span>;
  };

  const getFormatBadge = (fmt) => {
    const config = fmt === 'pptx' 
      ? { label: 'PPTX', color: 'bg-orange-500' } 
      : { label: 'DOCX', color: 'bg-blue-600' };
    return <span className={`${config.color} text-white px-1.5 py-0.5 rounded text-[10px] font-bold`}>{config.label}</span>;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <FiLayout className="mr-3 text-blue-600" />
            Template Library
          </h1>
          <p className="text-gray-500 mt-1">Manage branding and layouts for generated documents.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all active:scale-95"
        >
          <FiUpload />
          <span>Upload Template</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="flex items-center space-x-2 w-full lg:w-auto">
          <FiFilter className="text-gray-400" />
          <select 
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Global (All Divisions)</option>
            {divisions?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto lg:ml-auto">
          <select 
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Doc Types</option>
            <option value="quick_sales">Quick Sales</option>
            <option value="detailed_proposal">Detailed Proposal</option>
            <option value="presales">Presales</option>
            <option value="nda">NDA</option>
            <option value="sow">SOW</option>
          </select>

          <select 
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-gray-50 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Formats</option>
            <option value="pptx">PPTX</option>
            <option value="docx">DOCX</option>
          </select>

          <div className="flex bg-gray-100 p-1 rounded-lg ml-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              <FiGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
            >
              <FiList size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : templates?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FiLayout size={64} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No templates uploaded yet.</p>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 text-blue-600 font-bold hover:underline"
          >
            Upload your first template
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-4"}>
          {templates?.map(template => (
            <div 
              key={template.id} 
              className={`group bg-white rounded-2xl border transition-all overflow-hidden relative ${
                template.is_active ? 'border-green-200 shadow-sm' : 'border-gray-100'
              } hover:shadow-md hover:border-blue-200`}
            >
              {/* Thumbnail Area */}
              <div className="aspect-video bg-gray-50 relative group-hover:brightness-90 transition-all">
                <img 
                  src={`/api/templates/${template.id}/preview`} 
                  alt={template.template_name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const status = e.target.getAttribute('X-Thumbnail-Status');
                    // Headers aren't directly on img tag, handled by API
                  }}
                />
                
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all space-x-3">
                  {!template.is_active && (
                    <button 
                      onClick={() => activateMutation.mutate(template.id)}
                      className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm shadow-xl hover:bg-green-500 hover:text-white transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if(window.confirm('Are you sure you want to delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                    className="p-2.5 bg-red-500 text-white rounded-lg shadow-xl hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>

                {template.is_active && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                    <FiCheck size={14} />
                  </div>
                )}
              </div>

              {/* Info Area */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 truncate pr-2" title={template.template_name}>
                    {template.template_name}
                  </h3>
                  {getFormatBadge(template.format)}
                </div>

                <div className="flex flex-wrap gap-2">
                  {getDocTypeBadge(template.doc_type)}
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                    {template.division_id ? divisions?.find(d => d.id === template.division_id)?.name : 'Global'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-medium">
                  <span className="flex items-center">
                    <FiClock className="mr-1" />
                    {format(new Date(template.created_at), 'dd MMM yyyy')}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>{template.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isUploadModalOpen && (
        <UploadTemplateModal 
          onClose={() => setIsUploadModalOpen(false)} 
          onSuccess={() => {
            setIsUploadModalOpen(false);
            queryClient.invalidateQueries(['templates']);
          }}
        />
      )}
    </div>
  );
};

export default TemplateLibraryAdmin;
