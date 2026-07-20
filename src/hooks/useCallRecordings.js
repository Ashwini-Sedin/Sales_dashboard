import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useCallRecordings(leadId) {
    return useQuery({
        queryKey: ['calls', leadId],
        queryFn: () => api.get(`/api/leads/${leadId}/calls`).then(res => res.data || res),
        enabled: !!leadId
    });
}

export function usePlaybackUrl(leadId, callId) {
    return useQuery({
        queryKey: ['playback-url', callId],
        queryFn: () => api.get(`/api/leads/${leadId}/calls/${callId}/playback-url`).then(res => res.data || res),
        enabled: !!callId,
        staleTime: 0,
        gcTime: 0 // In v5, cacheTime is renamed to gcTime
    });
}
