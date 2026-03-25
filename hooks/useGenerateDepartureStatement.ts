import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { AnnualStatementDto } from '@/types/annualStatement';

const generateDepartureStatement = async (
    driverId: string
): Promise<AnnualStatementDto> => {
    const response = await api.post<ApiResponse<AnnualStatementDto>>(
        `/annual-statements/generate-for-departure/${driverId}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to generate departure statement');
};

export const useGenerateDepartureStatement = () => {
    const queryClient = useQueryClient();

    return useMutation<AnnualStatementDto, Error, string>({
        mutationFn: generateDepartureStatement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['annual-statements'] });
            queryClient.invalidateQueries({ queryKey: ['annual-statements-pending-departures'] });
            queryClient.invalidateQueries({ queryKey: ['annual-statements-overdue'] });
        },
    });
};
