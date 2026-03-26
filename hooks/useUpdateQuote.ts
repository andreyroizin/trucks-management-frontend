import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { QuoteDto, CreateQuoteRequest } from '@/types/quote';

const updateQuote = async ({
    id,
    request,
}: {
    id: string;
    request: CreateQuoteRequest;
}): Promise<QuoteDto> => {
    const response = await api.put<ApiResponse<QuoteDto>>(`/quotes/${id}`, request);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update quote');
};

export const useUpdateQuote = () => {
    const queryClient = useQueryClient();

    return useMutation<QuoteDto, Error, { id: string; request: CreateQuoteRequest }>({
        mutationFn: updateQuote,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            queryClient.invalidateQueries({ queryKey: ['quote', data.id] });
        },
    });
};
