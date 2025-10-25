import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type Driver = {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
};

export type Truck = {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
};

export type DriversResponse = {
    data: Driver[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
};

export type TrucksResponse = {
    data: Truck[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
};

const fetchDrivers = async (): Promise<DriversResponse> => {
    console.log('API: Fetching drivers for assignment');
    
    try {
        const response = await api.get<ApiResponse<DriversResponse>>('/drivers', {
            params: {
                pageNumber: 1,
                pageSize: 1000 // Get all drivers for assignment
            }
        });
        console.log('API: Drivers response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch drivers');
    } catch (error: any) {
        console.error('API: Fetch drivers failed:', error);
        throw error;
    }
};

const fetchTrucks = async (): Promise<TrucksResponse> => {
    console.log('API: Fetching trucks for assignment');
    
    try {
        const response = await api.get<ApiResponse<TrucksResponse>>('/cars', {
            params: {
                pageNumber: 1,
                pageSize: 1000 // Get all trucks for assignment
            }
        });
        console.log('API: Trucks response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch trucks');
    } catch (error: any) {
        console.error('API: Fetch trucks failed:', error);
        throw error;
    }
};

export const useDrivers = () => {
    return useQuery<DriversResponse, Error>({
        queryKey: ['drivers-for-assignment'],
        queryFn: fetchDrivers,
    });
};

export const useTrucks = () => {
    return useQuery<TrucksResponse, Error>({
        queryKey: ['trucks-for-assignment'],
        queryFn: fetchTrucks,
    });
};

// Combined hook for convenience
export const useDriversAndTrucks = () => {
    const driversQuery = useDrivers();
    const trucksQuery = useTrucks();
    
    return {
        drivers: driversQuery.data?.data || [],
        trucks: trucksQuery.data?.data || [],
        isLoadingDrivers: driversQuery.isLoading,
        isLoadingTrucks: trucksQuery.isLoading,
        isLoading: driversQuery.isLoading || trucksQuery.isLoading,
        driversError: driversQuery.error,
        trucksError: trucksQuery.error,
        error: driversQuery.error || trucksQuery.error,
    };
};
