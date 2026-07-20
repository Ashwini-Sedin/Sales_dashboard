import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useEmails(leadId, month) {
    return useQuery({
        queryKey: ['emails', leadId, month],
        queryFn: () => {
            const url = month ? `/api/leads/${leadId}/emails?month=${month}` : `/api/leads/${leadId}/emails`;
            return api.get(url).then(res => res.data || res);
        },
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
