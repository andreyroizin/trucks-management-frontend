import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type UpdateRideInput = {
    id: string;
    name: string;
    remark?: string;
    companyId: string;
};

export type UpdateRideResponse = {
    message: string;
};

// --- API CALL ---
const updateRide = async ({ id, ...rideData }: UpdateRideInput): Promise<ApiResponse<UpdateRideResponse>> => {
    const response = await api.put<ApiResponse<UpdateRideResponse>>(`/rides/${id}`, rideData);
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update ride');
};

// --- MUTATION HOOK ---
export const useEditRide = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateRide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            // Optionally invalidate ride detail if you have e.g. ['rideDetail', id]
        },
    });
};
