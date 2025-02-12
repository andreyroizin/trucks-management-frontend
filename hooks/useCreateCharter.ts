import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreateCharterInput = {
    name: string;
    clientId: string;
    remark?: string;
};

export type CreateCharterResponse = {
    id: string;
    name: string;
    clientId: string;
    remark?: string;
};

// --- API CALL ---
const createCharter = async (charter: CreateCharterInput): Promise<ApiResponse<CreateCharterResponse>> => {
    const response = await api.post<ApiResponse<CreateCharterResponse>>('/charters', charter);
    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create charter');
};

// --- MUTATION HOOK ---
export const useCreateCharter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (charter: CreateCharterInput) => createCharter(charter),
        onSuccess: () => {
            // Invalidate or refetch relevant queries
            queryClient.invalidateQueries({ queryKey: ['charters'] });
        },
    });
};
