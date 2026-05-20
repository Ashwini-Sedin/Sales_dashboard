import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axios';

const LEADS_QUERY_KEY = 'leads';

export const useLeadsList = (filters) => {
    return useQuery({
        queryKey: [LEADS_QUERY_KEY, filters],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/api/leads', { params: filters });
            return data.items || data;
        },
    });
};

export const useMainDashboardStats = () => {
    return useQuery({
        queryKey: ['mainDashboardStats'],
        queryFn: async () => {
            const response = await axiosInstance.get('/api/dashboard/stats');
            return response.data;
        },
    });
};

export const useCreateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newLead) => {
            const { data } = await axiosInstance.post('/api/leads', newLead);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
        },
    });
};

export const useUpdateLead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }) => {
            const { data } = await axiosInstance.put(`/api/leads/${id}`, updateData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
        },
    });
};

export const useChangeStage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, stage }) => {
            const { data } = await axiosInstance.post(`/api/leads/${id}/stage`, { stage });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ['mainDashboardStats'] });
            toast.success('Stage updated successfully');
        },
        onError: (error) => {
            const msg = error.response?.data?.detail || 'Failed to update lead stage';
            toast.error(msg);
        }
    });
};
