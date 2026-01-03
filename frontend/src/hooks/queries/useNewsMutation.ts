import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsService } from '../../services/api.service';

export const useNewsMutation = () => {
    const queryClient = useQueryClient();

    const insertMutation = useMutation({
        mutationFn: (record: any) => NewsService.insertNews(record),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, record }: { id: string | number; record: any }) => NewsService.updateNews(id, record),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => NewsService.deleteNews(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });

    return {
        insert: (record: any) => insertMutation.mutateAsync(record),
        update: (id: string | number, record: any) => updateMutation.mutateAsync({ id, record }),
        remove: (id: string | number) => deleteMutation.mutateAsync(id),
        loading: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
};
