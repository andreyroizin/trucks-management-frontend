import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/**
 * Reject a Part-Ride by its ID.
 * API: POST /partrides/{id}/reject
 */
const rejectPartRideRequest = async (id: string): Promise<void> => {
    const res = await api.post<ApiResponse<null>>(`/partrides/${id}/reject`);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to reject Part-Ride');
    }
};

export const useRejectPartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => rejectPartRideRequest(id),
        onSuccess: (_data, id) => {
            // Refresh this ride’s detail + any list queries
            queryClient.invalidateQueries({ queryKey: ['partRideDetail', id] });
            queryClient.invalidateQueries({ queryKey: ['partRides'] });
        },
    });
};
