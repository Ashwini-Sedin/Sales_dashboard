import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';

export const useDashboardStats = (divisionId = null) => {
    return useQuery({
        queryKey: ['reports', 'dashboard', divisionId],
        queryFn: async () => {
            const params = divisionId ? { division_id: divisionId } : {};
            const response = await axiosInstance.get('/api/reports/dashboard', { params });
            return response.data;
        },
    });
};

export const useTurnaroundReport = (divisionId = null, dateFrom = null, dateTo = null) => {
    return useQuery({
        queryKey: ['reports', 'turnaround', divisionId, dateFrom, dateTo],
        queryFn: async () => {
            const params = { division_id: divisionId, date_from: dateFrom, date_to: dateTo };
            const response = await axiosInstance.get('/api/reports/turnaround', { params });
            return response.data;
        },
    });
};

export const useFunnelReport = (divisionId = null) => {
    return useQuery({
        queryKey: ['reports', 'funnel', divisionId],
        queryFn: async () => {
            const params = divisionId ? { division_id: divisionId } : {};
            const response = await axiosInstance.get('/api/reports/funnel', { params });
            return response.data;
        },
    });
};

export const usePerformanceReport = (divisionId = null) => {
    return useQuery({
        queryKey: ['reports', 'performance', divisionId],
        queryFn: async () => {
            const params = divisionId ? { division_id: divisionId } : {};
            const response = await axiosInstance.get('/api/reports/performance', { params });
            return response.data;
        },
    });
};

export const useTrendsReport = (divisionId = null, months = 6) => {
    return useQuery({
        queryKey: ['reports', 'trends', divisionId, months],
        queryFn: async () => {
            const params = { division_id: divisionId, months };
            const response = await axiosInstance.get('/api/reports/trends', { params });
            return response.data;
        },
    });
};

export const exportToExcel = async (divisionId = null) => {
    const params = divisionId ? { division_id: divisionId } : {};
    const response = await axiosInstance.get('/api/reports/export-excel', {
        params,
        responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DealFlow_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
