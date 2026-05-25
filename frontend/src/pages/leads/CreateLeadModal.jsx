import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateLead } from '../../hooks/useLeads';
import { FiX } from 'react-icons/fi';
import api from '../../api/axios';

const CreateLeadModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const createLeadMutation = useCreateLead();
  const [divisions, setDivisions] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.get('/api/divisions'),
        api.get('/api/users')
      ])
      .then(([divRes, userRes]) => {
        setDivisions(divRes.data);
        setUsers(userRes.data);
      })
      .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    const nameParts = data.name.trim().split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

    const payload = {
      first_name,
      last_name,
      company_name: data.company,
      source: data.source || 'manual',
      division_id: data.division,
      owner_id: data.owner_id || null
    };

    createLeadMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-df-card rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-df-textlight">Create New Lead</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-df-text hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input 
              {...register('name', { required: 'Name is required' })} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg focus:outline-none focus:ring-1 focus:ring-df-accent text-sm"
              placeholder="John Doe"
            />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
            <input 
              {...register('company', { required: 'Company is required' })} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg focus:outline-none focus:ring-1 focus:ring-df-accent text-sm"
              placeholder="Acme Corp"
            />
            {errors.company && <span className="text-red-500 text-xs">{errors.company.message}</span>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
            <select 
              {...register('source')} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg focus:outline-none focus:ring-1 focus:ring-df-accent text-sm"
            >
              <option value="manual">Manual</option>
              <option value="referral">Referral</option>
              <option value="google_ads">Google Ads</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Division</label>
            <select 
              {...register('division', { required: 'Division is required' })} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg focus:outline-none focus:ring-1 focus:ring-df-accent text-sm"
            >
              <option value="">Select Division</option>
              {divisions.map(div => (
                <option key={div.id} value={div.id}>{div.name}</option>
              ))}
            </select>
            {errors.division && <span className="text-red-500 text-xs">{errors.division.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner</label>
            <select 
              {...register('owner_id')} 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-[#10151b] border border-gray-200 dark:border-df-border rounded-lg focus:outline-none focus:ring-1 focus:ring-df-accent text-sm"
            >
              <option value="">Select Owner (Optional)</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-df-border rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#10151b] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createLeadMutation.isPending}
              className="bg-df-accent hover:bg-opacity-90 text-white dark:text-black px-4 py-2 rounded-lg font-semibold transition-colors text-sm disabled:opacity-50"
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
