import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type RideDetailsUpdatePayload = {
    routeFromName?: string | null;
    routeToName?: string | null;
    notes?: string | null;
    plannedStartTime?: string | null;
    plannedEndTime?: string | null;
};

export type RideDetailsResponse = {
    id: string;
    routeFromName: string | null;
    routeToName: string | null;
    notes: string | null;
    plannedStartTime: string | null;
    plannedEndTime: string | null;
    updatedAt: string;
};

export const useUpdateRideDetails = () => {
    const queryClient = useQueryClient();
    
    return useMutation<ApiResponse<RideDetailsResponse>, Error, { rideId: string; data: RideDetailsUpdatePayload }>({
        mutationFn: async ({ rideId, data }) => {
            console.log('Updating ride details:', { rideId, data });
            
            const response = await api.put<ApiResponse<RideDetailsResponse>>(`/rides/${rideId}/details`, data);
            
            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Failed to update ride details');
            }
            
            console.log('Ride details updated successfully:', response.data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate weekly rides query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
        },
        onError: (error) => {
            console.error('Failed to update ride details:', error);
        }
    });
};
