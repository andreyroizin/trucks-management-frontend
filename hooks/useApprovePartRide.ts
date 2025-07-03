import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/**
 * Approve a Part-Ride by its ID.
 * API: POST /partrides/{id}/approve
 */
const approvePartRideRequest = async (id: string): Promise<void> => {
    const res = await api.post<ApiResponse<null>>(`/partrides/${id}/approve`);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to approve Part-Ride');
    }
};

export const useApprovePartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => approvePartRideRequest(id),
        onSuccess: async (_data, id) => {
            // Refresh this ride’s detail + any list queries
            await queryClient.invalidateQueries({ queryKey: ['partRideDetail', id] });
            await queryClient.invalidateQueries({queryKey: ['partRides']});
        },
    });
};
