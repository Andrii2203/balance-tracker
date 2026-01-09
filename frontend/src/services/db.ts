import Dexie from 'dexie';
import { logger } from '../utils/logger';

// ============================================
// Types
// ============================================

export interface MessageRecord {
  id?: number;
  client_id: string;  // UUID для дедуплікації
  user_id: string;
  message: string;
  created_at: string;
  pending?: number;  // 1 = pending, 0 = sent
  profiles?: {
    email: string;
  };
}

export interface SyncMetadata {
  key: string;
  value: any;
  updated_at: string;
}

export interface SettingRecord {
  key: string;
  value: any;
}

// ============================================
// Database
// ============================================

class AppDB extends Dexie {
  messages!: Dexie.Table<MessageRecord, number>;
  sync!: Dexie.Table<SyncMetadata, number>;
  settings!: Dexie.Table<SettingRecord, string>;

  constructor() {
    super('BalanceTrackerDB');
    
    // Version 1: Original schema
    // Version 2: Added messages store
    // Version 3: Renamed 'cached' to 'sync'
    this.version(3)
      .stores({
        messages: '++id, user_id, created_at, pending, client_id',
        sync: '++id, key, updated_at',
        settings: '&key'
      })
      .upgrade(async (tx) => {
        // Migrate from 'cached' to 'sync' if needed
        try {
          logger.info('[DB] Migrating from v2 to v3...');
          
          // Check if 'cached' store exists (old schema)
          try {
            const cachedStore = (tx as any).table('cached');
            if (cachedStore) {
              const items = await cachedStore.toArray();
              if (items.length > 0) {
                const syncTable = (tx as any).table('sync');
                for (const item of items) {
                  await syncTable.put({
                    key: item.key,
                    value: item.value,
                    updated_at: item.updated_at || new Date().toISOString()
                  });
                }
                logger.info('[DB] Migration complete', { migrated: items.length });
              }
            }
          } catch (e) {
            // 'cached' store doesn't exist, nothing to migrate
            logger.debug('[DB] No migration needed');
          }
        } catch (err) {
          logger.warn('[DB] Migration skipped', { err });
        }
      });
  }
}

export const db = new AppDB();

// ============================================
// Message Operations
// ============================================

/**
 * Save a message to IndexedDB
 */
export const saveMessage = async (msg: MessageRecord): Promise<number> => {
  try {
    const id = await db.messages.add(msg as MessageRecord);
    logger.debug('[DB] saveMessage id=' + id, { client_id: msg.client_id });
    return id as number;
  } catch (err) {
    logger.error('[DB] saveMessage error', { err, msg });
    throw err;
  }
};

/**
 * Update a message (e.g., mark as sent)
 */
export const updateMessage = async (id: number, updates: Partial<MessageRecord>): Promise<void> => {
  try {
    await db.messages.update(id, updates);
    logger.debug('[DB] updateMessage id=' + id);
  } catch (err) {
    logger.error('[DB] updateMessage error', { err, id });
    throw err;
  }
};

/**
 * Get all messages for a user
 */
export const getAllMessages = async (): Promise<MessageRecord[]> => {
  try {
    const messages = await db.messages.orderBy('created_at').toArray();
    logger.debug('[DB] getAllMessages count=' + messages.length);
    return messages;
  } catch (err) {
    logger.error('[DB] getAllMessages error', { err });
    return [];
  }
};

/**
 * Get pending messages (not yet sent to server)
 */
export const getPendingMessages = async (): Promise<MessageRecord[]> => {
  try {
    const pending = await db.messages.where('pending').equals(1).toArray();
    logger.debug('[DB] getPendingMessages count=' + pending.length);
    return pending;
  } catch (err) {
    logger.error('[DB] getPendingMessages error', { err });
    return [];
  }
};

/**
 * Mark message as sent
 */
export const markMessageSent = async (id: number, serverData?: Partial<MessageRecord>): Promise<void> => {
  try {
    const updates = { pending: 0, ...serverData };
    await db.messages.update(id, updates);
    
    // Emit event for UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bt:message-sent', { 
        detail: { id, server: serverData } 
      }));
    }
    
    logger.debug('[DB] markMessageSent id=' + id);
  } catch (err) {
    logger.error('[DB] markMessageSent error', { err, id });
    throw err;
  }
};

/**
 * Check if message exists by client_id
 */
export const messageExistsByClientId = async (clientId: string): Promise<boolean> => {
  try {
    const existing = await db.messages.where('client_id').equals(clientId).first();
    return !!existing;
  } catch (err) {
    logger.warn('[DB] messageExistsByClientId error', { err, clientId });
    return false;
  }
};

/**
 * Delete old messages (cleanup)
 */
export const deleteOldMessages = async (olderThan: Date): Promise<number> => {
  try {
    const oldMessages = await db.messages
      .where('created_at')
      .below(olderThan.toISOString())
      .toArray();
    
    const ids = oldMessages.map(m => m.id!).filter(Boolean);
    if (ids.length > 0) {
      await db.messages.bulkDelete(ids);
      logger.info('[DB] Deleted old messages', { count: ids.length });
    }
    
    return ids.length;
  } catch (err) {
    logger.error('[DB] deleteOldMessages error', { err });
    return 0;
  }
};

/**
 * Clear all messages (logout)
 */
export const clearAllMessages = async (): Promise<void> => {
  try {
    await db.messages.clear();
    logger.info('[DB] All messages cleared');
  } catch (err) {
    logger.error('[DB] clearAllMessages error', { err });
    throw err;
  }
};

// ============================================
// Sync Metadata
// ============================================

export const saveSyncMetadata = async (key: string, value: any): Promise<void> => {
  const now = new Date().toISOString();
  await db.sync.put({ key, value, updated_at: now });
};

export const getSyncMetadata = async (key: string): Promise<any> => {
  const record = await db.sync.where('key').equals(key).first();
  return record?.value;
};

export const getLastSyncTime = async (): Promise<Date | null> => {
  const lastSync = await getSyncMetadata('last_chat_sync');
  return lastSync ? new Date(lastSync) : null;
};

export const setLastSyncTime = async (): Promise<void> => {
  await saveSyncMetadata('last_chat_sync', new Date().toISOString());
};

// ============================================
// Settings
// ============================================

export const writeSetting = async (key: string, value: any): Promise<void> => {
  await db.settings.put({ key, value });
};

export const readSetting = async (key: string): Promise<any> => {
  const record = await db.settings.get(key as any);
  return record?.value;
};

// ============================================
// Legacy Cached Record (for backward compatibility)
// ============================================

export interface CachedRecord {
  key: string;
  value: any;
}

export const readCachedRecord = async (key: string): Promise<CachedRecord | undefined> => {
  try {
    const record = await db.sync.where('key').equals(key).first();
    if (record) {
      return { key: record.key, value: record.value };
    }
    return undefined;
  } catch (err) {
    logger.warn('[DB] readCachedRecord error', { key, err });
    return undefined;
  }
};

export const saveCachedRecord = async (key: string, value: any): Promise<void> => {
  await saveSyncMetadata(key, value);
};

export default db;
