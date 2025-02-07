import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type SurchargeDetails = {
    id: string;
    value: number;
    client: {
        id: string;
        name: string;
    };
    company: {
        id: string;
        name: string;
    };
};

// --- API CALL ---
const fetchSurchargeDetails = async (id: string): Promise<SurchargeDetails> => {
    const response = await api.get<ApiResponse<SurchargeDetails>>(`/surcharges/detail/${id}`);

    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch surcharge details');
};

// --- QUERY HOOK ---
export const useSurchargeDetails = (id: string) => {
    return useQuery({
        queryKey: ['surchargeDetails', id],
        queryFn: () => fetchSurchargeDetails(id),
    });
};
