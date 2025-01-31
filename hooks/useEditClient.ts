// hooks/useEditClient.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
type EditClient = {
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
    companyId: string;
};

type EditClientResponse = {
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
    companyId: string;
};

// --- FETCH FUNCTION ---
const editClient = async (clientData: EditClient): Promise<EditClientResponse> => {
    const response = await api.put<ApiResponse<EditClientResponse>>(
        `/clients/${clientData.id}`,
        clientData
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to edit client');
};

// --- CUSTOM HOOK ---
export const useEditClient = () => {
    const queryClient = useQueryClient();
    return useMutation<EditClientResponse, Error, EditClient>({
        mutationFn: editClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
};
