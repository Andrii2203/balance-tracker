import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect } from 'react';
import { useRealtimeQuery } from './useRealtimeQuery';
import { StatisticsService } from '../../services/api.service';
import { saveCachedRecord, readSetting, writeSetting } from '../../services/db';
import { logger } from '../../utils/logger';

export const useStatisticsQuery = (options: { enabled?: boolean } = {}) => {
    const queryKey = useMemo(() => ['statistics'], []);
    useRealtimeQuery('statistics', queryKey);

    const result = useQuery({
        queryKey,
        queryFn: async () => {
            const last = await readSetting('lastPulled:statistics');
            const since = last?.value || undefined;
            const data = await StatisticsService.fetchStatistics(since);
            // update lastPulled if we received data
            try {
                if (data && data.length) {
                    const maxUpdated = data.reduce((acc: string, r: any) => {
                        return r.updated_at && r.updated_at > acc ? r.updated_at : acc;
                    }, '');
                    if (maxUpdated) await writeSetting('lastPulled:statistics', maxUpdated);
                }
            } catch (e) { logger.warn('[useStatisticsQuery] failed to write lastPulled', e); }
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });

    // persist to cache when data is available
    useEffect(() => {
        if (result.data) {
            try { saveCachedRecord('statistics', result.data); } catch (err) { logger.warn('Failed to cache statistics', err); }
        }
    }, [result.data]);

    return result;
};
;
