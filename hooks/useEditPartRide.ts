import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EditPartRideInput = {
    id: string;
    rideId?: string;
    date: string;
    start: string;
    end: string;
    kilometers?: number;
    carId?: string;
    driverId?: string;
    costs?: number;
    clientId?: string;
    weekNumber?: number | null;
    unitId?: string;
    rateId?: string;
    costsDescription?: string;
    surchargeId?: string;
    turnover?: number;
    remark?: string;
    companyId?: string;
    charterId?: string;
};

// The API might return data or just a success message
export type EditPartRideResponse = {
    message?: string;
    // Or possibly an array of updated items
};

// --- PUT FUNCTION ---
const updatePartRide = async (payload: EditPartRideInput): Promise<ApiResponse<EditPartRideResponse>> => {
    const { id, ...body } = payload;
    const response = await api.put<ApiResponse<EditPartRideResponse>>(`/partrides/${id}`, body);

    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update part ride');
};

// --- HOOK ---
export const useEditPartRide = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePartRide,
        onSuccess: () => {
            // Invalidate or refetch relevant queries
            queryClient.invalidateQueries({ queryKey: ['partRides'] });
        },
    });
};
