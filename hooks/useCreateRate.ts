import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreateRateInput = {
    name: string;
    value: number;
    clientId: string;
};

export type CreateRateResponse = {
    id: string;
    name: string;
    value: number;
    clientId: string;
};

// --- API CALL ---
const createRate = async (rate: CreateRateInput): Promise<ApiResponse<CreateRateResponse>> => {
    const response = await api.post<ApiResponse<CreateRateResponse>>('/rates', rate);
    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create rate');
};

// --- MUTATION HOOK ---
export const useCreateRate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (rate: CreateRateInput) => createRate(rate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] }); // Ensure client rates refresh
        },
    });
};
