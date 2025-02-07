import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type DeleteDriverResponse = {
    message: string;
};

// --- API CALL ---
const deleteDriver = async (id: string): Promise<ApiResponse<DeleteDriverResponse>> => {
    const response = await api.delete<ApiResponse<DeleteDriverResponse>>(`/drivers/${id}`);

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete driver');
};

// --- MUTATION HOOK ---
export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDriver(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
        },
    });
};
