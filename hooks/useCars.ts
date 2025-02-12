import {keepPreviousData, useQuery} from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Car = {
    id: string;
    licensePlate: string;
    remark: string;
    companyId: string;
};

export type CarsResponse = {
    totalCars: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    cars: Car[];
};

// --- API CALL ---
const fetchCars = async (companyId: string, page: number, pageSize: number): Promise<CarsResponse> => {
    const response = await api.get<ApiResponse<CarsResponse>>(`/cars?companyId=${companyId}&page=${page}&pageSize=${pageSize}`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch cars');
    }
    return response.data.data;
};

// --- HOOK ---
export const useCars = (companyId: string, page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['cars', companyId, page, pageSize],
        queryFn: () => fetchCars(companyId, page, pageSize),
        enabled: !!companyId, // Ensure query runs only if companyId is present
        placeholderData: keepPreviousData,
    });
};
