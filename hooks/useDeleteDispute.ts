import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ---------- Fetcher ---------- */
const deleteDispute = async (id: string): Promise<void> => {
    const { data } = await api.delete<ApiResponse<null>>(`/disputes/${id}`);

    if (!data.isSuccess) {
        throw new Error(data.errors?.[0] || 'Failed to delete dispute');
    }
};

/* ---------- Hook ---------- */
export const useDeleteDispute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteDispute(id),

        // After delete, invalidate relevant queries
        onSuccess: (_void, id) => {
            queryClient.invalidateQueries({ queryKey: ['disputes'] });      // list page
            queryClient.removeQueries({ queryKey: ['dispute', id] });       // detail page
        },
    });
};