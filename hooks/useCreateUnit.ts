import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreateUnitInput = {
    value: string;
};

export type CreateUnitResponse = {
    id: string;
    value: string;
};

// --- API CALL ---
const createUnit = async (unit: CreateUnitInput): Promise<ApiResponse<CreateUnitResponse>> => {
    const response = await api.post<ApiResponse<CreateUnitResponse>>('/units', unit);
    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create unit');
};

// --- MUTATION HOOK ---
export const useCreateUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (unit: CreateUnitInput) => createUnit(unit),
        onSuccess: () => {
            // Invalidate any queries referencing units so they refetch
            queryClient.invalidateQueries({ queryKey: ['units'] });
        },
    });
};
