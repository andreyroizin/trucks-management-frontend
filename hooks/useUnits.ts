import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Unit = {
    id: string;
    value: string;
};

export type UnitsResponse = {
    totalUnits: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    units: Unit[];
};

// --- API CALL ---
const fetchUnits = async (page: number, pageSize: number): Promise<UnitsResponse> => {
    const response = await api.get<ApiResponse<UnitsResponse>>(`/units?pageNumber=${page}&pageSize=${pageSize}`);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch units');
};

// --- QUERY HOOK ---
export const useUnits = (page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['units', page, pageSize],
        queryFn: () => fetchUnits(page, pageSize),
        placeholderData: (prevData) => prevData, // Keeps previous data while loading new page
    });
};
