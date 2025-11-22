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
    kvk?: string;               // Optional
    btw?: string;               // Optional
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
    kvk?: string;
    btw?: string;
};

// --- FETCH FUNCTION ---
const createClient = async (newClient: NewClient): Promise<CreateClientResponse> => {
    console.log('📤 [useCreateClient] Sending client data:', newClient);
    console.log('📋 [useCreateClient] KVK being sent:', newClient.kvk);
    console.log('📋 [useCreateClient] BTW being sent:', newClient.btw);
    const response = await api.post<ApiResponse<CreateClientResponse>>(
        '/clients',
        newClient
    );
    console.log('📥 [useCreateClient] Response:', response.data);
    if (response.data.isSuccess) {
        console.log('✅ [useCreateClient] Created client:', response.data.data);
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
