import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { NewsService } from '../../services/api.service';

export const useNewsQuery = (options: { enabled?: boolean } = {}) => {
    const queryKey = useMemo(() => ['news'], []);
    useRealtimeQuery('news', queryKey);

    return useQuery({
        queryKey,
        queryFn: () => NewsService.fetchNews(),
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options,
    });
};
