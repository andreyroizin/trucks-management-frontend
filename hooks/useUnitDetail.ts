import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type UnitDetail = {
    id: string;
    value: string;
};

type UnitDetailResponse = UnitDetail;

// --- FETCH FUNCTION ---
const fetchUnitDetail = async (id: string): Promise<UnitDetailResponse> => {
    const response = await api.get<ApiResponse<UnitDetailResponse>>(`/units/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to load unit detail');
};

// --- HOOK ---
export const useUnitDetail = (id: string) => {
    return useQuery({
        queryKey: ['unitDetail', id],
        queryFn: () => fetchUnitDetail(id),
        placeholderData: (prevData) => prevData, // keepPreviousData-like
    });
};
