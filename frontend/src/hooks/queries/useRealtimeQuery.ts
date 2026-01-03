import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

export function useRealtimeQuery(tableName: string, queryKey: any[]) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel(`${tableName}-realtime-sync`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                (payload) => {
                    console.log(`📡 Realtime sync for ${tableName}:`, payload.eventType);

                    queryClient.setQueryData(queryKey, (oldData: any) => {
                        if (!oldData) return oldData;

                        let newData = [...oldData];

                        switch (payload.eventType) {
                            case 'INSERT':
                                const newRow = payload.new as any;
                                if (!newData.find(r => r.id === newRow.id)) {
                                    newData.push(newRow);
                                }
                                break;
                            case 'UPDATE':
                                const updatedRow = payload.new as any;
                                const index = newData.findIndex(r => r.id === updatedRow.id);
                                if (index !== -1) {
                                    newData[index] = { ...newData[index], ...updatedRow };
                                }
                                break;
                            case 'DELETE':
                                const oldRow = payload.old as any;
                                newData = newData.filter(r => r.id !== oldRow.id);
                                break;
                        }

                        // In-place sort if necessary (can be improved by passing sortFn)
                        return newData;
                    });

                    // Alternatively, just invalidate to be safe
                    // queryClient.invalidateQueries({ queryKey });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, queryKey, queryClient]);
}
