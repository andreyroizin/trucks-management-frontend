import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { AnnualStatementDto, GenerateRequest } from '@/types/annualStatement';

const generateAnnualStatement = async (
    request: GenerateRequest
): Promise<AnnualStatementDto> => {
    const response = await api.post<ApiResponse<AnnualStatementDto>>(
        '/annual-statements/generate',
        request
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to generate annual statement');
};

export const useGenerateAnnualStatement = () => {
    const queryClient = useQueryClient();

    return useMutation<AnnualStatementDto, Error, GenerateRequest>({
        mutationFn: generateAnnualStatement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['annual-statements'] });
        },
    });
};
