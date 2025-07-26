// hooks/useCreateClient.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api'; // Reuse existing ApiResponse type

// --- TYPES ---
type NewClient = {
    name: string;                // Required
    companyId: string;          // Required  
    tav?: string;               // Optional
    address?: string;           // Optional
    postcode?: string;          // Optional
    city?: string;              // Optional
    country?: string;           // Optional
    phoneNumber?: string;       // Optional
    email?: string;             // Optional
    remark?: string;            // Optional
};

type CreateClientResponse = {
    id: string;
    name: string;
    companyId: string;
    tav?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
};

// --- FETCH FUNCTION ---
const createClient = async (newClient: NewClient): Promise<CreateClientResponse> => {
    const response = await api.post<ApiResponse<CreateClientResponse>>(
        '/clients',
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
