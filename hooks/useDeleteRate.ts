import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
const deleteRate = async (id: string): Promise<string> => {
    const response = await api.delete<ApiResponse<string>>(`/rates/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to delete rate');
};

// --- DELETE HOOK ---
export const useDeleteRate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRate,
        onSuccess: () => {
            // Invalidate relevant queries after deletion
            queryClient.invalidateQueries({ queryKey: ['rates'] });
        },
    });
};
