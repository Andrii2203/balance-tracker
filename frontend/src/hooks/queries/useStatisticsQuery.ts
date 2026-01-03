import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { StatisticsService } from '../../services/api.service';

export const useStatisticsQuery = (options: { enabled?: boolean } = {}) => {
    const queryKey = useMemo(() => ['statistics'], []);
    useRealtimeQuery('statistics', queryKey);

    return useQuery({
        queryKey,
        queryFn: () => StatisticsService.fetchStatistics(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};
