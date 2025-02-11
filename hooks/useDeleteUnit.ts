import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
const deleteUnitRequest = async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/units/${id}`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to delete unit');
    }
};

// --- MUTATION HOOK ---
export const useDeleteUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteUnitRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['units'] });
        },
    });
};
