import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { QuotesService } from '../../services/api.service';

export const useQuotesQuery = (options: { enabled?: boolean } = {}) => {
    const queryKey = useMemo(() => ['quotes'], []);
    useRealtimeQuery('quotes', queryKey);

    return useQuery({
        queryKey,
        queryFn: () => QuotesService.fetchQuotes(),
        staleTime: 60 * 60 * 1000, // 1 hour
        ...options,
    });
};
