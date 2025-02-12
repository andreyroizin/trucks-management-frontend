import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CharterDetail = {
    id: string;
    name: string;
    clientId: string;
    clientName: string;
    companyId: string;
    companyName: string;
    remark?: string;
};

// --- FETCH FUNCTION ---
const fetchCharterDetail = async (id: string): Promise<CharterDetail> => {
    const response = await api.get<ApiResponse<CharterDetail>>(`/charters/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to load charter detail');
};

// --- HOOK ---
export const useCharterDetail = (id: string) => {
    return useQuery({
        queryKey: ['charterDetail', id],
        queryFn: () => fetchCharterDetail(id),
    });
};
