import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
const deleteCharterRequest = async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/charters/${id}`);

    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to delete charter');
    }
};

// --- HOOK ---
export const useDeleteCharter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCharterRequest(id),
        onSuccess: () => {
            // Invalidate or refetch relevant queries
            queryClient.invalidateQueries({ queryKey: ['charters'] });
        },
    });
};
