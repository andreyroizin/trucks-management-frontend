// hooks/useEditSurcharge.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EditSurchargeInput = {
    id: string;
    value: number;
};

// --- UPDATE FUNCTION ---
const updateSurcharge = async ({ id, value }: EditSurchargeInput): Promise<ApiResponse<string>> => {
    const response = await api.put<ApiResponse<string>>(`/surcharges/edit/${id}`, { value });
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update surcharge');
};

// --- HOOK ---
export const useEditSurcharge = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSurcharge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surcharges'] });
        },
    });
};
