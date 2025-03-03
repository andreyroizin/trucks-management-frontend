import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreateRideInput = {
    name: string;
    remark?: string;
    companyId: string;
};

export type CreateRideResponse = {
    message: string;
};

// --- API CALL ---
const createRide = async (ride: CreateRideInput): Promise<CreateRideResponse> => {
    const response = await api.post<ApiResponse<CreateRideResponse>>('/rides', ride);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create ride');
};

// --- MUTATION HOOK ---
export const useCreateRide = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRide,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rides'] });
        },
    });
};
