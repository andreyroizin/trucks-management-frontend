import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- API CALL ---
const deleteRide = async (rideId: string): Promise<ApiResponse<string>> => {
    const response = await api.delete<ApiResponse<string>>(`/rides/${rideId}`);

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete ride');
};

// --- MUTATION HOOK ---
export const useDeleteRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (rideId: string) => deleteRide(rideId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rides'] });
        },
    });
};
