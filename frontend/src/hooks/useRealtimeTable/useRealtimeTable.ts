import { useEffect, useState, useRef } from "react";
import { supabase } from '../../supabaseClient'
import { logger } from '../../utils/logger';
import useNetworkStatus from '../useNetworkStatus/useNetworkStatus';
import { readCachedRecord } from '../../services/db';

interface BaseRecord {
  id?: number | string;
  created_at?: string;
}

export function useRealtimeTable<T extends BaseRecord>(tableName: string, options: { enabled?: boolean } = { enabled: true }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(options.enabled ? true : false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const { isReachable } = useNetworkStatus();

  useEffect(() => {
    if (!tableName || !options.enabled) {
      if (!options.enabled) {
        setLoading(false);
        setData([]);
      }
      return;
    }

    if (channelRef.current) {
      logger.info(`🔌 Cleaning up previous subscription for ${tableName}`);
      try { channelRef.current.unsubscribe(); } catch (e) { logger.warn('Failed to unsubscribe previous channel', e); }
    }

    const fetchData = async () => {
      setLoading(true);
      logger.info(`🔄 Fetching ${tableName}...`);

      // Simple fetch without strict ordering that might fail
      const { data, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        logger.error(`❌ Error fetching ${tableName}:`, error.message);
        setError(error.message);
      } else {
        logger.info(`✅ Fetched ${tableName}`);
        // Sort in memory if created_at exists
        const sorted = data ? [...data].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return 0;
        }) : [];
        setData(sorted);
      }
      setLoading(false);
    };

    (async () => {
      // If not reachable, try to load cached record and skip network operations
      if (!isReachable) {
        logger.info(`📴 Network not reachable — restoring cached data for ${tableName}`);
        try {
          const rec = await readCachedRecord(tableName);
          if (rec && rec.value && Array.isArray(rec.value)) {
            const sorted = [...rec.value];
            setData(sorted);
          }
        } catch (e) {
          logger.debug('[useRealtimeTable] no cached record for', tableName);
        }
        setLoading(false);
        return;
      }

      await fetchData();

      const channel = supabase
        .channel(`${tableName}-realtime-${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableName },
          (payload: any) => {
            logger.debug(`📡 Realtime event on ${tableName}: ${payload.eventType}`, payload);

            const eventKey = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${payload.commit_timestamp}`;

            if (processedEventsRef.current.has(eventKey)) {
              logger.debug(`⚠️ Duplicate event detected, skipping: ${eventKey}`);
              return;
            }

            processedEventsRef.current.add(eventKey);

            if (processedEventsRef.current.size > 100) {
              processedEventsRef.current.clear();
            }

            const newRow = payload.new as T;
            const oldId = (payload.old as T)?.id;

            setData((prev) => {
              let updated = [...prev];
              let changed = false;

              switch (payload.eventType) {
                case "INSERT":
                  if (!updated.find(r => r.id === newRow.id)) {
                    logger.info(`➕ INSERT: Adding ${tableName} with id ${newRow.id}`);
                    updated = [...updated, newRow];
                    changed = true;
                  } else {
                    logger.warn(`⚠️ INSERT skipped - id ${newRow.id} already exists`);
                  }
                  break;

                case "UPDATE":
                  const oldIndex = updated.findIndex(r => r.id === newRow.id);
                  if (oldIndex !== -1) {
                    logger.info(`✏️ UPDATE: Updating ${tableName} id ${newRow.id}`);
                    updated[oldIndex] = newRow;
                    changed = true;
                  } else {
                    logger.warn(`⚠️ UPDATE skipped - id ${newRow.id} not found`);
                  }
                  break;

                case "DELETE":
                  const deleteIndex = updated.findIndex(r => r.id === oldId);
                  if (deleteIndex !== -1) {
                    logger.info(`🗑️ DELETE: Removing ${tableName} id ${oldId}`);
                    updated = updated.filter((r) => r.id !== oldId);
                    changed = true;
                  } else {
                    logger.warn(`⚠️ DELETE skipped - id ${oldId} not found`);
                  }
                  break;

                default:
                  logger.warn(`⚠️ Unknown event type: ${payload.eventType}`);
              }

              if (changed) {
                logger.debug(`📊 Updated ${tableName} after ${payload.eventType}`);
              }

              return changed ? updated : prev;
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    })();

    const channel = supabase
      .channel(`${tableName}-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload: any) => {
          logger.debug(`📡 Realtime event on ${tableName}: ${payload.eventType}`, payload);

          const eventKey = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${payload.commit_timestamp}`;

          if (processedEventsRef.current.has(eventKey)) {
            logger.debug(`⚠️ Duplicate event detected, skipping: ${eventKey}`);
            return;
          }

          processedEventsRef.current.add(eventKey);

          if (processedEventsRef.current.size > 100) {
            processedEventsRef.current.clear();
          }

          const newRow = payload.new as T;
          const oldId = (payload.old as T)?.id;

          setData((prev) => {
            let updated = [...prev];
            let changed = false;

            switch (payload.eventType) {
              case "INSERT":
                if (!updated.find(r => r.id === newRow.id)) {
                  logger.info(`➕ INSERT: Adding ${tableName} with id ${newRow.id}`);
                  updated = [...updated, newRow];
                  changed = true;
                } else {
                  logger.warn(`⚠️ INSERT skipped - id ${newRow.id} already exists`);
                }
                break;

              case "UPDATE":
                const oldIndex = updated.findIndex(r => r.id === newRow.id);
                if (oldIndex !== -1) {
                  logger.info(`✏️ UPDATE: Updating ${tableName} id ${newRow.id}`);
                  updated[oldIndex] = newRow;
                  changed = true;
                } else {
                  logger.warn(`⚠️ UPDATE skipped - id ${newRow.id} not found`);
                }
                break;

              case "DELETE":
                const deleteIndex = updated.findIndex(r => r.id === oldId);
                if (deleteIndex !== -1) {
                  logger.info(`🗑️ DELETE: Removing ${tableName} id ${oldId}`);
                  updated = updated.filter((r) => r.id !== oldId);
                  changed = true;
                } else {
                  logger.warn(`⚠️ DELETE skipped - id ${oldId} not found`);
                }
                break;

              default:
                logger.warn(`⚠️ Unknown event type: ${payload.eventType}`);
            }

            if (changed) {
              logger.debug(`📊 Updated ${tableName} after ${payload.eventType}`);
            }

            return changed ? updated : prev;
          });
        }
      )
      .subscribe();

    return () => {
      logger.info(`🔌 Unsubscribing from ${tableName}`);
      try { channelRef.current?.unsubscribe(); } catch (e) { logger.warn('Failed to unsubscribe channel', e); }
      channelRef.current = null;
    };
  }, [tableName, options.enabled, isReachable]);


  const insert = async (record: Omit<T, "id" | "created_at">) => {
    logger.info(`📝 Inserting into ${tableName}:`, record);
    const { data: newData, error } = await supabase
      .from(tableName)
      .insert([record])
      .select();

    if (error) {
      logger.error(`❌ Insert error:`, error.message);
      setError(error.message);
      return null;
    }

    if (newData && newData.length) {
      return newData[0];
    }
    return null;
  };

  const update = async (id: number | string, record: Partial<T>) => {
    logger.info(`📝 Updating ${tableName} id ${id}:`, record);
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(record)
      .eq("id", id)
      .select();

    if (error) {
      logger.error(`❌ Update error:`, error.message);
      setError(error.message);
    } else {
      logger.info(`✅ Update successful:`, updated);
    }
  };

  const remove = async (id: number | string) => {
    logger.info(`📝 Deleting ${tableName} id ${id}`);
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      logger.error(`❌ Delete error:`, error.message);
      setError(error.message);
    } else {
      logger.info(`✅ Delete successful`);
    }
  };

  return { data, loading, error, insert, update, remove };
}