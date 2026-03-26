import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { QuoteDto, CreateQuoteRequest } from '@/types/quote';

const createQuote = async (request: CreateQuoteRequest): Promise<QuoteDto> => {
    const response = await api.post<ApiResponse<QuoteDto>>('/quotes', request);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create quote');
};

export const useCreateQuote = () => {
    const queryClient = useQueryClient();

    return useMutation<QuoteDto, Error, CreateQuoteRequest>({
        mutationFn: createQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
};
