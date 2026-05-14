import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import toast from 'react-hot-toast';

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

export function useDocumentVersions(leadId) {
  return useQuery({
    queryKey: ['document-versions', leadId],
    queryFn: async () => {
      const response = await api.get(`/api/documents/lead/${leadId}/versions`);
      return response.data;
    },
    enabled: !!leadId
  });
}

export function useRestoreDocument() {
  return useMutation({
    mutationFn: async ({ documentId }) => {
      const response = await api.post(`/api/documents/${documentId}/restore`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Document restored as v${data.new_document.version_number}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to restore document');
    }
  });
}

export function useNdaClauses(divisionId) {
  return useQuery({
    queryKey: ['nda-clauses', divisionId],
    queryFn: async () => {
      const res = await api.get(`/api/nda-clauses?division_id=${divisionId}`);
      return res.data;
    },
    enabled: !!divisionId
  });
}

export function useLegalApprove() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, comments }) => {
      const res = await api.put(`/api/documents/${documentId}/legal-approve`, { comments });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('NDA approved by Legal');
      queryClient.invalidateQueries(['document-versions', data.lead_id]);
    },
    onError: () => {
      toast.error('Failed to approve NDA');
    }
  });
}

export function useLegalReject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, comments }) => {
      const res = await api.put(`/api/documents/${documentId}/legal-reject`, { comments });
      return res.data;
    },
    onSuccess: (data) => {
      toast.error('NDA rejected');
      queryClient.invalidateQueries(['document-versions', data.lead_id]);
    },
    onError: () => {
      toast.error('Failed to reject NDA');
    }
  });
}
