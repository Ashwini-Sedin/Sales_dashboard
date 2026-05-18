import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiUpload, FiFile, FiCheck } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { toast } from 'react-hot-toast';

const UploadTemplateModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      doc_type: 'quick_sales',
      format: 'pptx',
      division_id: ''
    }
  });

  const selectedFormat = watch('format');

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const res = await api.get('/api/divisions');
      return res.data;
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== selectedFormat) {
      toast.error(`Selected file is .${extension} but format is set to ${selectedFormat.toUpperCase()}`);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum 50MB.');
      return;
    }

    setFile(selectedFile);
  };

  const onSubmit = async (data) => {
    if (!file) {
      toast.error('Please select a template file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_name', data.template_name);
    formData.append('doc_type', data.doc_type);
    formData.append('format', data.format);
    if (data.division_id) formData.append('division_id', data.division_id);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await api.post('/api/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      toast.success('Template uploaded! Thumbnail is being generated.');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900">Upload Template</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <FiX className="text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Template Name */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Template Name</label>
            <input 
              {...register('template_name', { required: 'Name is required' })}
              placeholder="e.g. Q1 2026 Proposal Template"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {errors.template_name && <p className="text-xs text-red-500 mt-1">{errors.template_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Doc Type */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Doc Type</label>
              <select 
                {...register('doc_type')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="quick_sales">Quick Sales</option>
                <option value="detailed_proposal">Detailed Proposal</option>
                <option value="presales">Presales</option>
                <option value="nda">NDA</option>
                <option value="sow">SOW</option>
              </select>
            </div>

            {/* Format */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Format</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button 
                  type="button"
                  onClick={() => { setFile(null); register('format').onChange({ target: { value: 'pptx', name: 'format' } }); }}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedFormat === 'pptx' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  PPTX
                </button>
                <button 
                  type="button"
                  onClick={() => { setFile(null); register('format').onChange({ target: { value: 'docx', name: 'format' } }); }}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedFormat === 'docx' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  DOCX
                </button>
              </div>
              <input type="hidden" {...register('format')} />
            </div>
          </div>

          {/* Division */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Division</label>
            <select 
              {...register('division_id')}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Global (All Divisions)</option>
              {divisions?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Template File</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                file ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={selectedFormat === 'pptx' ? '.pptx' : '.docx'}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center text-center">
                  <FiFile className="text-green-500 mb-2" size={32} />
                  <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[10px] text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center text-gray-400">
                  <FiUpload className="mb-2" size={32} />
                  <p className="text-sm font-medium">Drag & drop your template here</p>
                  <p className="text-xs">or click to browse (. {selectedFormat})</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Max file size: 50MB</p>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-blue-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isUploading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FiCheck />
                <span>Upload Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadTemplateModal;
