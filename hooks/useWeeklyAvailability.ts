import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// Types based on backend response
export type DayAvailability = {
    hours: number;
    isCustom: boolean;
};

export type DriverAvailability = {
    driverId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    availability: Record<string, DayAvailability>; // date -> availability
};

export type TruckAvailability = {
    truckId: string;
    licensePlate: string;
    availability: Record<string, DayAvailability>; // date -> availability
};

export type WeeklyAvailabilityData = {
    weekStartDate: string;
    drivers: DriverAvailability[];
    trucks: TruckAvailability[];
};

export type BulkAvailabilityRequest = {
    availability: Record<string, number>; // date -> hours
};

export type BulkAvailabilityResponse = {
    resourceId: string;
    updatedDates: Array<{
        date: string;
        hours: number;
    }>;
};

// Fetch weekly availability for all drivers and trucks
const fetchWeeklyAvailability = async (weekStartDate: string, companyId?: string): Promise<WeeklyAvailabilityData> => {
    console.log('API: Fetching weekly availability for week:', weekStartDate);
    console.log('API: Company ID:', companyId);
    
    const params: any = {};
    if (companyId) {
        params.companyId = companyId;
    }
    
    try {
        const response = await api.get<ApiResponse<WeeklyAvailabilityData>>(`/availability/week/${weekStartDate}`, { params });
        console.log('API: Weekly availability response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        
        throw new Error(response.data.errors?.[0] || 'Failed to fetch weekly availability');
    } catch (error: any) {
        console.error('API: Weekly availability failed:', error);
        console.error('API: Request config:', error.config);
        console.error('API: Response status:', error.response?.status);
        console.error('API: Response data:', error.response?.data);
        throw error;
    }
};

// Update driver availability for multiple dates
const updateDriverAvailability = async (driverId: string, request: BulkAvailabilityRequest): Promise<BulkAvailabilityResponse> => {
    console.log('API: Updating driver availability for driver:', driverId, 'with data:', request);
    
    try {
        const response = await api.put<ApiResponse<BulkAvailabilityResponse>>(`/availability/driver/${driverId}/bulk`, request);
        console.log('API: Update driver availability response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to update driver availability');
    } catch (error: any) {
        console.error('API: Update driver availability failed:', error);
        
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

// Update truck availability for multiple dates
const updateTruckAvailability = async (truckId: string, request: BulkAvailabilityRequest): Promise<BulkAvailabilityResponse> => {
    console.log('API: Updating truck availability for truck:', truckId, 'with data:', request);
    
    try {
        const response = await api.put<ApiResponse<BulkAvailabilityResponse>>(`/availability/truck/${truckId}/bulk`, request);
        console.log('API: Update truck availability response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to update truck availability');
    } catch (error: any) {
        console.error('API: Update truck availability failed:', error);
        
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

// Hook to fetch weekly availability
export const useWeeklyAvailability = (weekStartDate: string, companyId?: string) => {
    return useQuery<WeeklyAvailabilityData, Error>({
        queryKey: ['weekly-availability', weekStartDate, companyId],
        queryFn: () => fetchWeeklyAvailability(weekStartDate, companyId),
        enabled: !!weekStartDate, // Only fetch if weekStartDate is provided
    });
};

// Hook to update driver availability
export const useUpdateDriverAvailability = () => {
    const queryClient = useQueryClient();
    
    return useMutation<BulkAvailabilityResponse, Error, { driverId: string; availability: Record<string, number> }>({
        mutationFn: ({ driverId, availability }) => updateDriverAvailability(driverId, { availability }),
        onSuccess: () => {
            // Invalidate availability queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['weekly-availability'] });
        },
    });
};

// Hook to update truck availability
export const useUpdateTruckAvailability = () => {
    const queryClient = useQueryClient();
    
    return useMutation<BulkAvailabilityResponse, Error, { truckId: string; availability: Record<string, number> }>({
        mutationFn: ({ truckId, availability }) => updateTruckAvailability(truckId, { availability }),
        onSuccess: () => {
            // Invalidate availability queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['weekly-availability'] });
        },
    });
};

// Helper function to get availability hours for a specific resource and date
export const getAvailabilityHours = (
    resourceId: string,
    date: string,
    availabilityData: WeeklyAvailabilityData | undefined,
    type: 'driver' | 'truck'
): number => {
    if (!availabilityData) return 8.0; // Default
    
    const resources = type === 'driver' ? availabilityData.drivers : availabilityData.trucks;
    const resource = resources.find(r => 
        type === 'driver' 
            ? (r as DriverAvailability).driverId === resourceId 
            : (r as TruckAvailability).truckId === resourceId
    );
    
    if (!resource) return 8.0; // Default
    
    const dayAvailability = resource.availability[date];
    return dayAvailability ? dayAvailability.hours : 8.0; // Default
};

// Helper function to check if availability is custom for a specific resource and date
export const isAvailabilityCustom = (
    resourceId: string,
    date: string,
    availabilityData: WeeklyAvailabilityData | undefined,
    type: 'driver' | 'truck'
): boolean => {
    if (!availabilityData) return false;
    
    const resources = type === 'driver' ? availabilityData.drivers : availabilityData.trucks;
    const resource = resources.find(r => 
        type === 'driver' 
            ? (r as DriverAvailability).driverId === resourceId 
            : (r as TruckAvailability).truckId === resourceId
    );
    
    if (!resource) return false;
    
    const dayAvailability = resource.availability[date];
    return dayAvailability ? dayAvailability.isCustom : false;
};
