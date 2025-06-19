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
const fetchCars = async (companyIds: string[], page: number, pageSize: number): Promise<CarsResponse> => {
    const queryParams = new URLSearchParams();
    companyIds.forEach(id => queryParams.append('companyIds', id));
    queryParams.set('pageNumber', page.toString());
    queryParams.set('pageSize', pageSize.toString());

    const response = await api.get<ApiResponse<CarsResponse>>(`/cars?${queryParams.toString()}`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch cars');
    }
    return response.data.data;
};

// --- HOOK ---
export const useCars = (companyIds: string[], page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['cars', companyIds, page, pageSize],
        queryFn: () => fetchCars(companyIds, page, pageSize),
        placeholderData: keepPreviousData,
    });
};
