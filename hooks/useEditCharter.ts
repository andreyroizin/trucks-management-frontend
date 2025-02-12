import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EditCharterInput = {
    id?: string;
    name: string;
    clientId: string;
    remark?: string;
};

// --- UPDATE FUNCTION ---
const updateCharter = async ({ id, ...charterData }: EditCharterInput): Promise<ApiResponse<string>> => {
    const response = await api.put<ApiResponse<string>>(`/charters/${id}`, charterData);
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update charter.');
};

// --- MUTATION HOOK ---
export const useEditCharter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCharter,
        onSuccess: () => {
            // Invalidate or refetch relevant queries after successful edit
            queryClient.invalidateQueries({ queryKey: ['charters'] });
            queryClient.invalidateQueries({ queryKey: ['charterDetail'] });
        },
    });
};
