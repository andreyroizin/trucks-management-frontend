import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { QuotesListResponse } from '@/types/quote';

const fetchQuotes = async ({
    pageNumber,
    pageSize,
    search,
    status,
    companyId,
}: {
    pageNumber: number;
    pageSize: number;
    search?: string;
    status?: string;
    companyId?: string;
}): Promise<QuotesListResponse> => {
    const params = new URLSearchParams();
    params.set('pageNumber', pageNumber.toString());
    params.set('pageSize', pageSize.toString());
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (companyId) params.set('companyId', companyId);

    const response = await api.get<ApiResponse<QuotesListResponse>>(
        `/quotes?${params.toString()}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch quotes');
};

export const useQuotes = ({
    pageNumber,
    pageSize,
    search,
    status,
    companyId,
}: {
    pageNumber: number;
    pageSize: number;
    search?: string;
    status?: string;
    companyId?: string;
}) => {
    return useQuery<QuotesListResponse, Error>({
        queryKey: ['quotes', pageNumber, pageSize, search, status, companyId],
        queryFn: () => fetchQuotes({ pageNumber, pageSize, search, status, companyId }),
        placeholderData: keepPreviousData,
    });
};
