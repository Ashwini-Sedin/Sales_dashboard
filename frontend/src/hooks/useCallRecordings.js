import { useQuery } from '@tanstack/react-query';
import api from '../api'; // Assuming you have an api helper set up

export function useCallRecordings(leadId) {
    return useQuery(
        ['calls', leadId],
        () => api.get(`/api/leads/${leadId}/calls`).then(res => res.data || res),
        { enabled: !!leadId }
    );
}

export function usePlaybackUrl(leadId, callId) {
    return useQuery(
        ['playback-url', callId],
        () => api.get(`/api/leads/${leadId}/calls/${callId}/playback-url`).then(res => res.data || res),
        {
            enabled: !!callId,
            staleTime: 0,
            cacheTime: 0
        }
    );
}
