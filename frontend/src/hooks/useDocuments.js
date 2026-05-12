import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useDocuments(leadId) {
  return useQuery({
    queryKey: ['documents', leadId],
    queryFn: async () => {
      const url = leadId ? `/api/documents?lead_id=${leadId}` : '/api/documents';
      const response = await api.get(url);
      return response.data;
    }
  });
}

export function useDocumentDownload() {
  return async (documentId) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/download`);
      const { download_url } = response.data;
      if (download_url) {
        window.open(download_url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };
}

export function useCaseStudies(divisionId) {
  return useQuery({
    queryKey: ['case-studies', divisionId],
    queryFn: async () => {
      const response = await api.get(`/api/case-studies?division_id=${divisionId}`);
      return response.data;
    },
    enabled: !!divisionId
  });
}

export function useTaskStatus(taskId) {
  return useQuery({
    queryKey: ['task-status', taskId],
    queryFn: async () => {
      const response = await api.get(`/api/tasks/${taskId}/status`);
      return response.data;
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === 'Complete' || data.status === 'Failed') return false;
      return 2000;
    }
  });
}
