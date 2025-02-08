import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type PendingClient = {
    id: string;
    name: string;
    tav: string | null;
    address: string | null;
    postcode: string | null;
    city: string | null;
    country: string | null;
    phoneNumber: string | null;
    email: string | null;
    remark: string | null;
    companyId: string;
    isApproved: boolean;
    companyName: string;
};

export type PendingClientsResponse = PendingClient[];

// --- FETCH FUNCTION ---
const fetchPendingClients = async (): Promise<PendingClientsResponse> => {
    const response = await api.get<ApiResponse<PendingClientsResponse>>('/clients/pending');
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch pending clients');
};

// --- HOOK ---
export const usePendingClients = () => {
    return useQuery<PendingClientsResponse, Error>({
        queryKey: ['clients', 'pending'],
        queryFn: fetchPendingClients,
        placeholderData: (prevData) => prevData, // Placeholder for smooth transitions
    });
};
