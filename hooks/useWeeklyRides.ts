import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type AssignedDriver = {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    plannedHours: number; // Hours for this specific driver
};

export type AssignedTruck = {
    id: string;
    licensePlate: string;
};

export type WeeklyRide = {
    id: string;
    tripNumber: string | null; // Trip number for the ride
    plannedHours: number; // Total ride hours (for truck)
    routeFromName: string | null;
    routeToName: string | null;
    assignedDriver: AssignedDriver | null; // Primary driver with their hours
    secondDriver: AssignedDriver | null; // Second driver with their hours
    assignedTruck: AssignedTruck | null;
    notes: string | null;
    plannedStartTime: string | null; // HH:mm:ss format
    plannedEndTime: string | null; // HH:mm:ss format
    creationMethod: 'TEMPLATE_GENERATED' | 'MANUAL';
    executionCompletionStatus?: string; // "none", "partial", "complete", "approved"
};

export type WeeklyRideClient = {
    clientId: string;
    clientName: string;
    rides: WeeklyRide[];
};

export type WeeklyRideDay = {
    date: string; // YYYY-MM-DD
    dayName: string; // e.g., "Monday"
    clients: WeeklyRideClient[];
};

export type WeeklyRidesData = {
    weekStartDate: string; // YYYY-MM-DD (always Monday)
    days: WeeklyRideDay[];
};

const fetchWeeklyRides = async (weekStartDate: string, companyId?: string): Promise<WeeklyRidesData> => {
    console.log('API: Fetching weekly rides for week starting:', weekStartDate);
    console.log('API: Company ID:', companyId);
    console.log('API: Base URL:', api.defaults.baseURL);

    const params: any = {
        weekStartDate: weekStartDate,
    };
    
    if (companyId) {
        params.companyId = companyId;
    }

    console.log('API: Request params:', params);
    console.log('API: Full URL will be:', `${api.defaults.baseURL}/weekly-planning/rides`);

    try {
        const response = await api.get<ApiResponse<WeeklyRidesData>>('/weekly-planning/rides', { params });
        console.log('API: Weekly rides response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch weekly rides');
    } catch (error: any) {
        console.error('API: Weekly rides failed:', error);
        console.error('API: Error message:', error.message);
        console.error('API: Error response status:', error.response?.status);
        console.error('API: Error response data:', error.response?.data);
        console.error('API: Request URL:', error.config?.url);
        console.error('API: Request params:', error.config?.params);
        console.error('API: Full error object:', error);
        
        // Re-throw with more context
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

export const useWeeklyRides = (weekStartDate: string, companyId?: string) => {
    return useQuery<WeeklyRidesData, Error>({
        queryKey: ['weekly-rides', weekStartDate, companyId],
        queryFn: () => fetchWeeklyRides(weekStartDate, companyId),
        enabled: !!weekStartDate, // Only run if weekStartDate is provided
    });
};
