import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { QuoteDto } from '@/types/quote';

const fetchQuoteDetail = async (id: string): Promise<QuoteDto> => {
    const response = await api.get<ApiResponse<QuoteDto>>(`/quotes/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch quote');
};

export const useQuoteDetail = (id: string) => {
    return useQuery<QuoteDto, Error>({
        queryKey: ['quote', id],
        queryFn: () => fetchQuoteDetail(id),
        enabled: !!id,
    });
};
