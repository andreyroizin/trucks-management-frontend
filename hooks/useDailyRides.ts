import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { WeeklyRide, AssignedDriver, AssignedTruck } from './useWeeklyRides';

export type DailyRideClient = {
    clientId: string;
    clientName: string;
    rides: WeeklyRide[];
};

export type DailyRidesData = {
    date: string; // YYYY-MM-DD
    dayName: string; // e.g., "Monday"
    clients: DailyRideClient[];
};

const fetchDailyRides = async (date: string, companyId?: string): Promise<DailyRidesData> => {
    console.log('API: Fetching daily rides for date:', date);
    console.log('API: Company ID:', companyId);
    
    const params: any = {
        date: date
    };
    
    if (companyId) {
        params.companyId = companyId;
    }
    
    try {
        const response = await api.get<ApiResponse<DailyRidesData>>('/daily-planning/rides', { params });
        console.log('API: Daily rides response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        
        throw new Error(response.data.errors?.[0] || 'Failed to fetch daily rides');
    } catch (error: any) {
        console.error('API: Daily rides failed:', error);
        console.error('API: Request config:', error.config);
        console.error('API: Response status:', error.response?.status);
        console.error('API: Response data:', error.response?.data);
        throw error;
    }
};

export const useDailyRides = (date: string, companyId?: string) => {
    return useQuery<DailyRidesData, Error>({
        queryKey: ['daily-rides', date, companyId],
        queryFn: () => fetchDailyRides(date, companyId),
        enabled: !!date, // Only fetch if date is provided
    });
};

// Hook to get available dates with rides (for date picker)
const fetchAvailableDates = async (companyId?: string): Promise<string[]> => {
    console.log('API: Fetching available dates with rides');
    
    const params: any = {};
    if (companyId) {
        params.companyId = companyId;
    }
    
    try {
        const response = await api.get<ApiResponse<{ dates: string[] }>>('/daily-planning/available-dates', { params });
        console.log('API: Available dates response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data.dates;
        }
        
        throw new Error(response.data.errors?.[0] || 'Failed to fetch available dates');
    } catch (error: any) {
        console.error('API: Available dates failed:', error);
        throw error;
    }
};

export const useAvailableDates = (companyId?: string) => {
    return useQuery<string[], Error>({
        queryKey: ['available-dates', companyId],
        queryFn: () => fetchAvailableDates(companyId),
    });
};
