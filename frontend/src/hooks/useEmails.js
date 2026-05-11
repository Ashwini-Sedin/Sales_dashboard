import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useEmails(leadId) {
    return useQuery({
        queryKey: ['emails', leadId],
        queryFn: () => api.get(`/api/leads/${leadId}/emails`).then(res => res.data || res),
        enabled: !!leadId
    });
}

export function useEmailAttachments(leadId, messageId, enabled) {
    return useQuery({
        queryKey: ['attachments', messageId],
        queryFn: () => api.get(`/api/leads/${leadId}/emails/${messageId}/attachments`).then(res => res.data || res),
        enabled: enabled && !!messageId
    });
}
