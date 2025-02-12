import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type RateDetail = {
    id: string;
    name: string;
    value: number;
    clientId: string;
    clientName: string;
    companyId: string;
    companyName: string;
};

type RateDetailResponse = RateDetail;

// --- FETCH FUNCTION ---
const fetchRateDetail = async (id: string): Promise<RateDetail> => {
    const response = await api.get<ApiResponse<RateDetailResponse>>(`/rates/detail/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to load rate detail');
};

// --- DETAIL HOOK ---
export const useRateDetail = (id: string) => {
    return useQuery({
        queryKey: ['rateDetail', id],
        queryFn: () => fetchRateDetail(id),
        placeholderData: (prevData) => prevData, // Keep previous data while fetching
    });
};
