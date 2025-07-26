import {keepPreviousData, useQuery} from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Car = {
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

export type CarsResponse = {
    totalCars: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    cars: Car[];
};

// --- API CALL ---
const fetchCars = async (companyIds: string[], page: number, pageSize: number, search?: string): Promise<CarsResponse> => {
    const queryParams = new URLSearchParams();
    companyIds.forEach(id => queryParams.append('companyIds', id));
    queryParams.set('pageNumber', page.toString());
    queryParams.set('pageSize', pageSize.toString());
    if (search) {
        queryParams.set('search', search);
    }

    const response = await api.get<ApiResponse<CarsResponse>>(`/cars?${queryParams.toString()}`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch cars');
    }
    return response.data.data;
};

// --- HOOK ---
export const useCars = (companyIds: string[], page: number, pageSize: number, search?: string) => {
    return useQuery({
        queryKey: ['cars', companyIds, page, pageSize, search],
        queryFn: () => fetchCars(companyIds, page, pageSize, search),
        placeholderData: keepPreviousData,
    });
};
