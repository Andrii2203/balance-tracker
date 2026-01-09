import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { NewsService } from '../../services/api.service';
import { saveCachedRecord, readSetting, writeSetting } from '../../services/db';
import { logger } from '../../utils/logger';

export const useNewsQuery = (options: { enabled?: boolean } = {}): UseQueryResult<any[], Error> => {
    const queryKey = useMemo(() => ['news'], []);
    useRealtimeQuery('news', queryKey);

    const result = useQuery<any[], Error>({
        queryKey,
        queryFn: async () => {
            const last = await readSetting('lastPulled:news');
            const since = last?.value || undefined;
            const data = await NewsService.fetchNews(since);
            try {
                if (data && data.length) {
                    const maxUpdated = data.reduce((acc: string, r: any) => {
                        return r.updated_at && r.updated_at > acc ? r.updated_at : acc;
                    }, '');
                    if (maxUpdated) await writeSetting('lastPulled:news', maxUpdated);
                }
            } catch (e) { logger.warn('[useNewsQuery] failed to write lastPulled', e); }
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        ...options as any,
    });

    useEffect(() => {
        if (result.data) {
            try {
                saveCachedRecord('news', result.data);
            } catch (err) {
                logger.warn('Failed to cache news', err);
            }
        }
    }, [result.data]);

    return result;
};
