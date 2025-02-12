import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CarDetail = {
    id: string;
    licensePlate: string;
    remark: string;
    company: {
        id: string;
        name: string;
    };
};

// --- API CALL ---
const fetchCarDetail = async (id: string): Promise<CarDetail> => {
    const response = await api.get<ApiResponse<CarDetail>>(`/cars/${id}`);

    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch car details');
};

// --- HOOK ---
export const useCarDetail = (id: string) => {
    return useQuery({
        queryKey: ['carDetail', id],
        queryFn: () => fetchCarDetail(id),
    });
};
