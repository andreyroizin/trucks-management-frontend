import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type HoursCode = {
    id: string;
    name: string;
    isActive: boolean;
};

// --- FETCHER ---
async function fetchHoursCodes(): Promise<HoursCode[]> {
    const res = await api.get<ApiResponse<HoursCode[]>>('/hourscodes'); // ✅ Fixed here
    if (res.data.isSuccess) {
        return res.data.data;
    }
    throw new Error(res.data.errors?.[0] || 'Failed to fetch hours codes');
}

// --- HOOK ---
export function useHoursCodes() {
    return useQuery({
        queryKey: ['hoursCodes'],
        queryFn: fetchHoursCodes
    });
}
