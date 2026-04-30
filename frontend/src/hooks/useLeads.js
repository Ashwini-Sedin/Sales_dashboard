import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axios';

const LEADS_QUERY_KEY = 'leads';

export const useLeadsList = (filters) => {
    return useQuery({
        queryKey: [LEADS_QUERY_KEY, filters],
        queryFn: async () => {
            const { data } = await axiosInstance.get('/api/leads', { params: filters });
            return data;
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
            const { data } = await axiosInstance.patch(`/api/leads/${id}/stage`, { stage });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] });
        },
    });
};
