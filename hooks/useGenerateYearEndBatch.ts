import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { BatchGenerationResultDto } from '@/types/annualStatement';

const generateYearEndBatch = async (
    year: number
): Promise<BatchGenerationResultDto> => {
    const response = await api.post<ApiResponse<BatchGenerationResultDto>>(
        `/annual-statements/generate-year-end-batch/${year}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to generate year-end batch');
};

export const useGenerateYearEndBatch = () => {
    const queryClient = useQueryClient();

    return useMutation<BatchGenerationResultDto, Error, number>({
        mutationFn: generateYearEndBatch,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['annual-statements'] });
        },
    });
};
