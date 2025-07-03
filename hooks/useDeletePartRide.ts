import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
const deletePartRideRequest = async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/partrides/${id}`);

    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to delete part ride');
    }
};

// --- HOOK ---
export const useDeletePartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePartRideRequest(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['partRides'] });
        },
    });
};