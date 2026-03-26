import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { QuoteDto } from '@/types/quote';

const updateQuoteStatus = async ({
    id,
    status,
}: {
    id: string;
    status: string;
}): Promise<QuoteDto> => {
    const response = await api.put<ApiResponse<QuoteDto>>(`/quotes/${id}/status`, { status });
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update quote status');
};

export const useUpdateQuoteStatus = () => {
    const queryClient = useQueryClient();

    return useMutation<QuoteDto, Error, { id: string; status: string }>({
        mutationFn: updateQuoteStatus,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['quote', data.id] });
        },
    });
};
