import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PendingDepartureDto } from '@/types/annualStatement';

const fetchOverdueStatements = async (): Promise<PendingDepartureDto[]> => {
    const response = await api.get<ApiResponse<PendingDepartureDto[]>>(
        '/annual-statements/overdue'
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch overdue statements');
};

export const useOverdueStatements = () => {
    return useQuery<PendingDepartureDto[], Error>({
        queryKey: ['annual-statements-overdue'],
        queryFn: fetchOverdueStatements,
    });
};
