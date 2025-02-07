// hooks/useDeleteSurcharge.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
const deleteSurcharge = async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete<ApiResponse<string>>(`/surcharges/${id}`);
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to delete surcharge');
};

// --- HOOK ---
export const useDeleteSurcharge = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSurcharge,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surcharges'] });
        },
    });
};
