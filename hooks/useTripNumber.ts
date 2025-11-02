import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type UpdateTripNumberRequest = {
    tripNumber: string | null;
};

export type UpdateTripNumberResponse = {
    id: string;
    tripNumber: string | null;
};

const updateTripNumber = async (rideId: string, request: UpdateTripNumberRequest): Promise<UpdateTripNumberResponse> => {
    console.log('API: Updating trip number for ride:', rideId, 'with data:', request);
    
    try {
        const response = await api.put<ApiResponse<UpdateTripNumberResponse>>(`/rides/${rideId}/trip-number`, request);
        console.log('API: Update trip number response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to update trip number');
    } catch (error: any) {
        console.error('API: Update trip number failed:', error);
        
        if (error.response?.data?.errors) {
            throw new Error(error.response.data.errors[0] || 'Backend error');
        } else if (error.response?.status) {
            throw new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Request failed'}`);
        } else if (error.message) {
            throw new Error(`Network error: ${error.message}`);
        } else {
            throw new Error('Unknown error occurred');
        }
    }
};

export const useUpdateTripNumber = () => {
    const queryClient = useQueryClient();
    
    return useMutation<UpdateTripNumberResponse, Error, { rideId: string; tripNumber: string | null }>({
        mutationFn: ({ rideId, tripNumber }) => updateTripNumber(rideId, { tripNumber }),
        onSuccess: () => {
            // Invalidate both weekly and daily rides queries to update the UI
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
            queryClient.invalidateQueries({ queryKey: ['daily-rides'] });
        },
    });
};
