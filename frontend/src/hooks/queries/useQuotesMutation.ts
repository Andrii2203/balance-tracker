import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuotesService } from '../../services/api.service';

export const useQuotesMutation = () => {
    const queryClient = useQueryClient();

    const insertMutation = useMutation({
        mutationFn: (record: any) => QuotesService.insertQuote(record),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, record }: { id: string | number; record: any }) => QuotesService.updateQuote(id, record),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => QuotesService.deleteQuote(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });

    return {
        insert: (record: any) => insertMutation.mutateAsync(record),
        update: (id: string | number, record: any) => updateMutation.mutateAsync({ id, record }),
        remove: (id: string | number) => deleteMutation.mutateAsync(id),
        loading: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
};
