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

// Updated to match working useDrivers pattern
export type DriverUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
};

export type DriverForAssignment = {
    id: string;
    companyId: string;
    companyName: string;
    user: DriverUser;
};

export type DriversApiResponse = {
    totalDrivers: number;
    pageNumber: number;
    pageSize: number;
    drivers: DriverForAssignment[];
};

const fetchDrivers = async (): Promise<DriverForAssignment[]> => {
    console.log('API: Fetching drivers for assignment');
    
    try {
        const response = await api.get<ApiResponse<DriversApiResponse>>('/drivers', {
            params: {
                pageNumber: 1,
                pageSize: 1000 // Get all drivers for assignment
            }
        });
        console.log('API: Drivers response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data.drivers; // Match working pattern
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch drivers');
    } catch (error: any) {
        console.error('API: Fetch drivers failed:', error);
        throw error;
    }
};

// Updated to match working useCars pattern
export type CarForAssignment = {
    id: string;
    licensePlate: string;
    remark: string;
    companyId: string;
    vehicleYear?: string;
    registrationDate?: string;
    driverId?: string | null;
    driverFirstName?: string | null;
    driverLastName?: string | null;
    driverEmail?: string | null;
};

export type CarsApiResponse = {
    totalCars: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    cars: CarForAssignment[];
};

const fetchTrucks = async (): Promise<CarForAssignment[]> => {
    console.log('API: Fetching trucks for assignment');
    
    try {
        const response = await api.get<ApiResponse<CarsApiResponse>>('/cars', {
            params: {
                pageNumber: 1,
                pageSize: 1000 // Get all trucks for assignment
            }
        });
        console.log('API: Trucks response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data.cars; // Match working pattern
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch trucks');
    } catch (error: any) {
        console.error('API: Fetch trucks failed:', error);
        throw error;
    }
};

export const useDrivers = () => {
    return useQuery<DriverForAssignment[], Error>({
        queryKey: ['drivers-for-assignment'],
        queryFn: fetchDrivers,
    });
};

export const useTrucks = () => {
    return useQuery<CarForAssignment[], Error>({
        queryKey: ['trucks-for-assignment'],
        queryFn: fetchTrucks,
    });
};

// Transform driver data to match RideAssignmentCard expectations
const transformDriverForAssignment = (driver: DriverForAssignment): Driver => ({
    id: driver.id,
    firstName: driver.user.firstName,
    lastName: driver.user.lastName,
    fullName: `${driver.user.firstName} ${driver.user.lastName}`,
    email: driver.user.email,
    phoneNumber: '' // Not available in this API response
});

// Transform car data to match RideAssignmentCard expectations
const transformCarForAssignment = (car: CarForAssignment): Truck => ({
    id: car.id,
    licensePlate: car.licensePlate,
    brand: '', // Not available in this API response
    model: car.remark || '', // Use remark as model fallback
    year: parseInt(car.vehicleYear || '0') || 0
});

// Combined hook for convenience
export const useDriversAndTrucks = () => {
    const driversQuery = useDrivers();
    const trucksQuery = useTrucks();
    
    return {
        drivers: driversQuery.data?.map(transformDriverForAssignment) || [],
        trucks: trucksQuery.data?.map(transformCarForAssignment) || [],
        isLoadingDrivers: driversQuery.isLoading,
        isLoadingTrucks: trucksQuery.isLoading,
        isLoading: driversQuery.isLoading || trucksQuery.isLoading,
        driversError: driversQuery.error,
        trucksError: trucksQuery.error,
        error: driversQuery.error || trucksQuery.error,
    };
};
