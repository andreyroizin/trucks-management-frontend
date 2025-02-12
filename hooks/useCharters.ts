import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Charter = {
    id: string;
    name: string;
    remark: string;
    clientId: string;
    companyId: string;
};

export type ChartersResponse = {
    totalCharters: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: Charter[];
};

// --- FETCH FUNCTION ---
const fetchCharters = async (companyId: string, clientId: string, page: number, pageSize: number): Promise<ChartersResponse> => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.append('companyId', companyId);
    if (clientId)  queryParams.append('clientId', clientId);
    queryParams.append('pageNumber', page.toString());
    queryParams.append('pageSize', pageSize.toString());

    const response = await api.get<ApiResponse<ChartersResponse>>(`/charters?${queryParams.toString()}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch charters');
};

// --- HOOK ---
export const useCharters = (companyId: string, clientId: string, page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['charters', companyId, clientId, page, pageSize],
        queryFn: () => fetchCharters(companyId, clientId, page, pageSize),
        placeholderData: (prevData) => prevData, // keepPreviousData
    });
};
