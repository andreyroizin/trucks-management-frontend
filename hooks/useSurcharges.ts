import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
type Company = { id: string; name: string };
type Client = { id: string; name: string };

type Surcharge = {
    id: string;
    value: number;
    client: Client;
    company: Company;
};

type SurchargesResponse = {
    totalSurcharges: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: Surcharge[];
};

// --- FETCH FUNCTION ---
const fetchSurcharges = async (clientId: string, page: number, pageSize: number): Promise<SurchargesResponse> => {
    const response = await api.get<ApiResponse<SurchargesResponse>>(`/surcharges/${clientId}?page=${page}&pageSize=${pageSize}`);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch surcharges');
};

// --- CUSTOM HOOK ---
export const useSurcharges = (clientId: string, page: number, pageSize: number) => {
    return useQuery<SurchargesResponse, Error>({
        queryKey: ['surcharges', clientId, page, pageSize],
        queryFn: () => fetchSurcharges(clientId, page, pageSize),
        placeholderData: (previousData) => previousData, // Maintain previous data while fetching new pages
    });
};
