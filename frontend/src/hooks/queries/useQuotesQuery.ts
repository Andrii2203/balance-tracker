import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { QuotesService } from '../../services/api.service';
import { saveCachedRecord, readSetting, writeSetting } from '../../services/db';
import { logger } from '../../utils/logger';

export const useQuotesQuery = (options: { enabled?: boolean } = {}): UseQueryResult<any[], Error> => {
    const queryKey = useMemo(() => ['quotes'], []);
    useRealtimeQuery('quotes', queryKey);

    const result = useQuery<any[], Error>({
        queryKey,
        queryFn: async () => {
            const last = await readSetting('lastPulled:quotes');
            const since = last?.value || undefined;
            const data = await QuotesService.fetchQuotes(since);
            try {
                if (data && data.length) {
                    const maxUpdated = data.reduce((acc: string, r: any) => {
                        return r.updated_at && r.updated_at > acc ? r.updated_at : acc;
                    }, '');
                    if (maxUpdated) await writeSetting('lastPulled:quotes', maxUpdated);
                }
            } catch (e) { logger.warn('[useQuotesQuery] failed to write lastPulled', e); }
            return data;
        },
        staleTime: 60 * 60 * 1000, // 1 hour
        ...options as any,
    });

    useEffect(() => {
        if (result.data) {
            try {
                saveCachedRecord('quotes', result.data);
            } catch (err) {
                logger.warn('Failed to cache quotes', err);
            }
        }
    }, [result.data]);

    return result;
};
