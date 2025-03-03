import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Ride = {
    id: string;
    name: string;
    companyId: string;
    companyName: string;
    remark?: string;
};

export type RidesResponse = {
    totalRides: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: Ride[];
};

// --- FETCH FUNCTION ---
const fetchRides = async (page: number, pageSize: number): Promise<RidesResponse> => {
    const response = await api.get<ApiResponse<RidesResponse>>(`/rides?pageNumber=${page}&pageSize=${pageSize}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch rides');
};

// --- QUERY HOOK ---
export const useRides = (page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['rides', page, pageSize],
        queryFn: () => fetchRides(page, pageSize),
        placeholderData: (prevData) => prevData, // keepPreviousData-like behavior
    });
};
