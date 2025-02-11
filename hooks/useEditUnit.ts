import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EditUnitInput = {
    id: string;
    value: string;
};

type EditUnitResponse = {
    id: string;
    value: string;
};

// --- UPDATE FUNCTION ---
const updateUnit = async ({ id, value }: EditUnitInput): Promise<ApiResponse<EditUnitResponse>> => {
    const response = await api.put<ApiResponse<EditUnitResponse>>(`/units/${id}`, { value });
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update unit');
};

// --- MUTATION HOOK ---
export const useEditUnit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateUnit,
        onSuccess: () => {
            // Invalidate relevant queries (e.g. 'units', 'unitDetail')
            queryClient.invalidateQueries({ queryKey: ['units'] });
            queryClient.invalidateQueries({ queryKey: ['unitDetail'] });
        },
    });
};
