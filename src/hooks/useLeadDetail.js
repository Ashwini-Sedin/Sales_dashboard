import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axios';

export const useLeadDetail = (leadId) => {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/leads/${leadId}`);
      return response.data;
    },
    enabled: !!leadId,
  });
};

export const useLeadTimeline = (leadId) => {
  return useQuery({
    queryKey: ['leadTimeline', leadId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/api/leads/${leadId}/timeline`);
      return response.data.items;
    },
    enabled: !!leadId,
  });
};

export const useAddLeadNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, note }) => {
      const response = await axiosInstance.post(`/api/leads/${leadId}/notes`, { note });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leadTimeline', variables.leadId] });
    },
  });
};

export const useUpdateLeadTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, team }) => {
      const response = await axiosInstance.put(`/api/leads/${leadId}/team`, team);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useUpdateLeadStage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, stage }) => {
      const response = await axiosInstance.post(`/api/leads/${leadId}/stage`, { stage });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leadTimeline', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['mainDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Stage updated successfully');
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || 'Failed to update lead stage';
      toast.error(msg);
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, data }) => {
      const response = await axiosInstance.put(`/api/leads/${leadId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leadTimeline', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
