import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useEmails(leadId) {
    return useQuery(
        ['emails', leadId],
        () => api.get(`/api/leads/${leadId}/emails`).then(res => res.data || res),
        { enabled: !!leadId }
    );
}

export function useEmailAttachments(leadId, messageId, enabled) {
    return useQuery(
        ['attachments', messageId],
        () => api.get(`/api/leads/${leadId}/emails/${messageId}/attachments`).then(res => res.data || res),
        { enabled: enabled && !!messageId }
    );
}
