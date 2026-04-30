import React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateLead } from '../../hooks/useLeads';
import { FiX } from 'react-icons/fi';

const CreateLeadModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const createLeadMutation = useCreateLead();

  if (!isOpen) return null;

  const onSubmit = (data) => {
    createLeadMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Lead</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              {...register('name', { required: 'Name is required' })} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input 
              {...register('company', { required: 'Company is required' })} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Corp"
            />
            {errors.company && <span className="text-red-500 text-xs">{errors.company.message}</span>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input 
              {...register('source')} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Website, Referral"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
            <select 
              {...register('division')} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Division</option>
              <option value="Enterprise">Enterprise</option>
              <option value="SMB">SMB</option>
              <option value="Mid-Market">Mid-Market</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner (ID for now)</label>
            <input 
              type="number"
              {...register('owner_id')} 
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Owner ID"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createLeadMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createLeadMutation.isPending ? 'Saving...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeadModal;
