import { QueryClient } from '@tanstack/react-query';
import { readCachedRecord } from '../services/db';
import { logger } from '../utils/logger';

const KEYS = ['statistics', 'news', 'quotes'];

export async function prepopulateQueryClient(queryClient: QueryClient) {
  try {
    for (const key of KEYS) {
      try {
        const rec = await readCachedRecord(key);
        if (rec && rec.value) {
          // For consistent keys we use arrays/objects as stored
          queryClient.setQueryData([key], rec.value);
          logger.debug('[prepopulate] setQueryData', { key, count: Array.isArray(rec.value) ? rec.value.length : 1 });
        }
      } catch (err) {
        logger.warn('[prepopulate] failed to read cached record', { key, err });
      }
    }
  } catch (err) {
    logger.error('[prepopulate] unexpected error', err);
  }
}

export default prepopulateQueryClient;
