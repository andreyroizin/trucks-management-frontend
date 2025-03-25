// hooks/useHoursOptions.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type HoursOption = {
    id: string;
    name: string;
    isActive: boolean;
};

// --- FETCHER ---
const fetchHoursOptions = async (): Promise<HoursOption[]> => {
    const res = await api.get<ApiResponse<HoursOption[]>>('/hoursoptions');
    if (res.data.isSuccess) {
        return res.data.data;
    }
    throw new Error(res.data.errors?.[0] || 'Failed to fetch hours options');
};

// --- HOOK ---
export function useHoursOptions() {
    return useQuery({
        queryKey: ['hoursOptions'],
        queryFn: fetchHoursOptions
    });
}
