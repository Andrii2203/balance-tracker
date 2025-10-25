import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";

interface BaseRecord {
  id?: number;
  created_at?: string;
}

export function useRealtimeTable<T extends BaseRecord>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tableName) return;

    if (channelRef.current) {
      console.log(`🔌 Cleaning up previous subscription for ${tableName}`);
      channelRef.current.unsubscribe();
    }

    const fetchData = async () => {
      setLoading(true);
      console.log(`🔄 Fetching ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error.message);
        setError(error.message);
      } else {
        console.log(`✅ Fetched ${tableName}:`, data);
        setData(data || []);
      }
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`${tableName}-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        (payload: any) => {
          console.log(`📡 Realtime event on ${tableName}:`, payload.eventType, payload);
          
          const eventKey = `${payload.eventType}-${payload.new?.id || payload.old?.id}-${payload.commit_timestamp}`;
          
          if (processedEventsRef.current.has(eventKey)) {
            console.log(`⚠️ Duplicate event detected, skipping: ${eventKey}`);
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
                  console.log(`➕ INSERT: Adding ${tableName} with id ${newRow.id}`);
                  updated = [...updated, newRow];
                  changed = true;
                } else {
                  console.warn(`⚠️ INSERT skipped - id ${newRow.id} already exists`);
                }
                break;

              case "UPDATE":
                const oldIndex = updated.findIndex(r => r.id === newRow.id);
                if (oldIndex !== -1) {
                  console.log(`✏️ UPDATE: Updating ${tableName} id ${newRow.id}`);
                  updated[oldIndex] = newRow;
                  changed = true;
                } else {
                  console.warn(`⚠️ UPDATE skipped - id ${newRow.id} not found`);
                }
                break;

              case "DELETE":
                const deleteIndex = updated.findIndex(r => r.id === oldId);
                if (deleteIndex !== -1) {
                  console.log(`🗑️ DELETE: Removing ${tableName} id ${oldId}`);
                  updated = updated.filter((r) => r.id !== oldId);
                  changed = true;
                } else {
                  console.warn(`⚠️ DELETE skipped - id ${oldId} not found`);
                }
                break;

              default:
                console.warn(`⚠️ Unknown event type: ${payload.eventType}`);
            }

            if (changed) {
              console.log(`📊 After ${payload.eventType}:`, updated.length, "items");
            } else {
              console.log(`📊 No changes for ${payload.eventType}`);
            }
            
            return changed ? updated : prev;
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      console.log(`🔌 Unsubscribing from ${tableName}`);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [tableName]);


  const insert = async (record: Omit<T, "id" | "created_at">) => {
    console.log(`📝 Inserting into ${tableName}:`, record);
    const { data: newData, error } = await supabase
      .from(tableName)
      .insert([record])
      .select();

    if (error) {
      console.error(`❌ Insert error:`, error.message);
      setError(error.message);
      return null;
    }

    console.log(`✅ Insert successful:`, newData);
    if (newData && newData.length) {

      return newData[0];
    }
    return null;
  };

  const update = async (id: number, record: Partial<T>) => {
    console.log(`📝 Updating ${tableName} id ${id}:`, record);
    const { data: updated, error } = await supabase
      .from(tableName)
      .update(record)
      .eq("id", id)
      .select();

    if (error) {
      console.error(`❌ Update error:`, error.message);
      setError(error.message);
    } else {
      console.log(`✅ Update successful:`, updated);
    }
  };

  const remove = async (id: number) => {
    console.log(`📝 Deleting ${tableName} id ${id}`);
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      console.error(`❌ Delete error:`, error.message);
      setError(error.message);
    } else {
      console.log(`✅ Delete successful`);
    }
  };

  return { data, loading, error, insert, update, remove };
}