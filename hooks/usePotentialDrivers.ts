import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PotentialDriverListResponse } from '@/types/potentialDriver';

const fetchPotentialDrivers = async (
    pageNumber: number,
    pageSize: number,
    status?: string,
    search?: string,
): Promise<PotentialDriverListResponse> => {
    const params: Record<string, any> = { pageNumber, pageSize };
    if (status) params.status = status;
    if (search) params.search = search;

    const response = await api.get<ApiResponse<PotentialDriverListResponse>>('/potential-drivers', { params });
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch potential drivers');
};

export const usePotentialDrivers = (
    pageNumber = 1,
    pageSize = 50,
    status?: string,
    search?: string,
) => {
    return useQuery<PotentialDriverListResponse, Error>({
        queryKey: ['potentialDrivers', pageNumber, pageSize, status, search],
        queryFn: () => fetchPotentialDrivers(pageNumber, pageSize, status, search),
        placeholderData: keepPreviousData,
    });
};
