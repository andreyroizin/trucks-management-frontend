import {useQuery} from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Rate = {
    id: string;
    name: string;
    value: number;
    clientId: string;
    clientName: string;
    companyId: string;
    companyName: string;
};

export type RatesResponse = {
    totalRates: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    rates: Rate[];
};

// --- FETCH FUNCTION ---
const fetchRates = async (clientId: string, page: number, pageSize: number): Promise<RatesResponse> => {
    const response = await api.get<ApiResponse<RatesResponse>>(`/rates/${clientId}?pageNumber=${page}&pageSize=${pageSize}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch rates');
};

// --- HOOK ---
export const useRates = (clientId: string, page: number, pageSize: number) => {
    return useQuery({
        queryKey: ['rates', clientId, page, pageSize],
        queryFn: () => fetchRates(clientId, page, pageSize),
        placeholderData: (prevData) => prevData,
    });
};
