import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PotentialDriver } from '@/types/potentialDriver';

const fetchPotentialDriverDetail = async (id: string): Promise<PotentialDriver> => {
    const response = await api.get<ApiResponse<PotentialDriver>>(`/potential-drivers/${id}`);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch potential driver');
};

export const usePotentialDriverDetail = (id: string) => {
    return useQuery<PotentialDriver, Error>({
        queryKey: ['potentialDriver', id],
        queryFn: () => fetchPotentialDriverDetail(id),
        enabled: !!id,
    });
};
