import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

const approveClientRequest = async (clientId: string): Promise<ApiResponse<string>> => {
    const response = await api.put<ApiResponse<string>>(`/clients/${clientId}/approve`);
    if (response.data.isSuccess) {
        return response.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to approve client.');
};

export const useApproveClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveClientRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
};
