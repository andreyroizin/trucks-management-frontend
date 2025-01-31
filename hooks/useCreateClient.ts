// hooks/useCreateClient.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api'; // Reuse existing ApiResponse type

// --- TYPES ---
type NewClient = {
    name: string;
    tav?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    companyId?: string;
};

type CreateClientResponse = {
    id: string;
    name: string;
    tav?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    companyId?: string;
};

// --- FETCH FUNCTION ---
const createClient = async (newClient: NewClient): Promise<CreateClientResponse> => {
    const response = await api.post<ApiResponse<CreateClientResponse>>(
        'https://localhost:7129/clients',
        newClient
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create client');
};

// --- CUSTOM HOOK ---
export const useCreateClient = () => {
    const queryClient = useQueryClient();
    return useMutation<CreateClientResponse, Error, NewClient>({
        mutationFn: createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['clients']});
        },
    });
};
