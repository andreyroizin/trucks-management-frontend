import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type EditRateInput = {
    value: number;
    name: string;
};

const editRate = async (id: string, rateData: EditRateInput): Promise<ApiResponse<string>> => {
    const response = await api.put<ApiResponse<string>>(`/rates/${id}`, rateData);

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to update rate.');
};

// Hook for editing a rate
export const useEditRate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...rateData }: { id: string } & EditRateInput) => editRate(id, rateData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rates'] });
        },
    });
};
