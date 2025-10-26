import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// Types for assignment requests
export type AssignDriverTruckRequest = {
    driverId?: string | null;
    driverPlannedHours?: number | null;
    truckId?: string | null;
    totalPlannedHours: number;
};

export type AddSecondDriverRequest = {
    driverId: string;
    plannedHours: number;
};

export type UpdateHoursRequest = {
    totalPlannedHours: number;
    primaryDriverHours?: number;
    secondDriverHours?: number;
};

// API functions
const assignDriverTruck = async (rideId: string, data: AssignDriverTruckRequest): Promise<void> => {
    console.log('API: Assigning driver/truck to ride:', rideId, data);
    
    try {
        const response = await api.put<ApiResponse<any>>(`/rides/${rideId}/assign`, data);
        console.log('API: Assignment response:', response.data);
        
        if (!response.data.isSuccess) {
            throw new Error(response.data.errors?.[0] || 'Failed to assign driver/truck');
        }
    } catch (error: any) {
        console.error('API: Assignment failed:', error);
        throw error;
    }
};

const addSecondDriver = async (rideId: string, data: AddSecondDriverRequest): Promise<void> => {
    console.log('API: Adding second driver to ride:', rideId, data);
    
    try {
        const response = await api.post<ApiResponse<any>>(`/rides/${rideId}/second-driver`, data);
        console.log('API: Add second driver response:', response.data);
        
        if (!response.data.isSuccess) {
            throw new Error(response.data.errors?.[0] || 'Failed to add second driver');
        }
    } catch (error: any) {
        console.error('API: Add second driver failed:', error);
        throw error;
    }
};

const removeSecondDriver = async (rideId: string): Promise<void> => {
    console.log('API: Removing second driver from ride:', rideId);
    
    try {
        const response = await api.delete<ApiResponse<any>>(`/rides/${rideId}/second-driver`);
        console.log('API: Remove second driver response:', response.data);
        
        if (!response.data.isSuccess) {
            throw new Error(response.data.errors?.[0] || 'Failed to remove second driver');
        }
    } catch (error: any) {
        console.error('API: Remove second driver failed:', error);
        throw error;
    }
};

const updateRideHours = async (rideId: string, data: UpdateHoursRequest): Promise<void> => {
    console.log('API: Updating ride hours:', rideId, data);
    
    try {
        const response = await api.put<ApiResponse<any>>(`/rides/${rideId}/hours`, data);
        console.log('API: Update hours response:', response.data);
        
        if (!response.data.isSuccess) {
            throw new Error(response.data.errors?.[0] || 'Failed to update hours');
        }
    } catch (error: any) {
        console.error('API: Update hours failed:', error);
        throw error;
    }
};

// Mutation hooks
export const useAssignDriverTruck = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ rideId, data }: { rideId: string; data: AssignDriverTruckRequest }) => 
            assignDriverTruck(rideId, data),
        onSuccess: () => {
            // Invalidate weekly rides query to refresh data
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
        },
    });
};

export const useAddSecondDriver = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ rideId, data }: { rideId: string; data: AddSecondDriverRequest }) => 
            addSecondDriver(rideId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
        },
    });
};

export const useRemoveSecondDriver = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (rideId: string) => removeSecondDriver(rideId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
        },
    });
};

export const useUpdateRideHours = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ rideId, data }: { rideId: string; data: UpdateHoursRequest }) => 
            updateRideHours(rideId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
        },
    });
};
