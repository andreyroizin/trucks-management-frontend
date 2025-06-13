import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreatePartRideInput = {
    rideId?: string;            // Possibly optional if user is a driver & hidden
    date: string;               // e.g. "2024-03-06T00:00:00Z"
    start: string;              // e.g. "20:00:00"
    end: string;                // e.g. "05:00:00"
    kilometers?: number;
    carId?: string;             // hidden if driver
    driverId?: string;          // hidden/prefilled if driver
    costs?: number;
    clientId?: string;          // hidden if driver
    weekNumber?: number;
    costsDescription?: string;
    hoursCodeId?: string,
    hoursOptionId?: string,
    hoursCorrection?: number,
    variousCompensation?: number,
    turnover?: number;          // hidden if driver
    remark?: string;
    companyId?: string;         // if driver, prefill or hide
    charterId?: string;         // hidden if driver
    newUploadIds?: string[],
};

// The API may return an array if multiple entries were created
export type CreatePartRideResponse = {
    id: string;
    date: string;
    start: string;
    end: string;
    // ... Additional fields
}[];

// --- API CALL ---
const createPartRide = async (payload: CreatePartRideInput): Promise<ApiResponse<CreatePartRideResponse>> => {
    const response = await api.post<ApiResponse<CreatePartRideResponse>>('/partrides', payload);

    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create part ride');
};

// --- MUTATION HOOK ---
export const useCreatePartRide = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPartRide,
        onSuccess: () => {
            // Example: Invalidate or refetch relevant queries after successful creation
            queryClient.invalidateQueries({ queryKey: ['partRides'] });
        },
    });
};
