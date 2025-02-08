import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type PendingCompany = {
    id: string;
    name: string;
    isApproved: boolean;
};

export type PendingCompaniesResponse = PendingCompany[];

// --- API CALL ---
const fetchPendingCompanies = async (): Promise<PendingCompaniesResponse> => {
    const response = await api.get<ApiResponse<PendingCompaniesResponse>>('/companies/pending');
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch pending companies.');
};

// --- HOOK ---
export const usePendingCompanies = () => {
    return useQuery({
        queryKey: ['pendingCompanies'],
        queryFn: fetchPendingCompanies,
        placeholderData: (prevData) => prevData,
    });
};
