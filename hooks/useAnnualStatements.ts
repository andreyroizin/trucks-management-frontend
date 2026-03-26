import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { AnnualStatementsResponse } from '@/types/annualStatement';

const fetchAnnualStatements = async ({
    year,
    driverId,
    status,
    companyId,
    pageNumber,
    pageSize,
}: {
    year?: number;
    driverId?: string;
    status?: string;
    companyId?: string;
    pageNumber: number;
    pageSize: number;
}): Promise<AnnualStatementsResponse> => {
    const params = new URLSearchParams();
    if (year) params.set('year', year.toString());
    if (driverId) params.set('driverId', driverId);
    if (status !== undefined) params.set('status', status.toString());
    if (companyId) params.set('companyId', companyId);
    params.set('pageNumber', pageNumber.toString());
    params.set('pageSize', pageSize.toString());

    const response = await api.get<ApiResponse<AnnualStatementsResponse>>(
        `/annual-statements?${params.toString()}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch annual statements');
};

export const useAnnualStatements = ({
    year,
    driverId,
    status,
    companyId,
    pageNumber,
    pageSize,
}: {
    year?: number;
    driverId?: string;
    status?: string;
    companyId?: string;
    pageNumber: number;
    pageSize: number;
}) => {
    return useQuery<AnnualStatementsResponse, Error>({
        queryKey: ['annual-statements', year, driverId, status, companyId, pageNumber, pageSize],
        queryFn: () => fetchAnnualStatements({ year, driverId, status, companyId, pageNumber, pageSize }),
        placeholderData: keepPreviousData,
    });
};
