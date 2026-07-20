import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../api/axios';

export const useAnalytics = (divisionId = null, months = 6) => {
    return useQuery({
        queryKey: ['reports', 'analytics', divisionId, months],
        queryFn: async () => {
            const params = { months };
            if (divisionId) params.division_id = divisionId;
            const response = await axiosInstance.get('/api/reports/analytics', { params });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // cache 5 min
        refetchOnWindowFocus: false,
    });
};

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
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]
        || `DealFlow_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    const url = window.URL.createObjectURL(new Blob([response.data], {
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }));
    const link = document.createElement('a');
    try {
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
    } finally {
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    }
};
