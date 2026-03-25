import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PotentialDriver, CreatePotentialDriverInput } from '@/types/potentialDriver';

const createPotentialDriver = async (data: CreatePotentialDriverInput): Promise<PotentialDriver> => {
    const response = await api.post<ApiResponse<PotentialDriver>>('/potential-drivers', data);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create potential driver');
};

export const useCreatePotentialDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<PotentialDriver, Error, CreatePotentialDriverInput>({
        mutationFn: createPotentialDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['potentialDrivers'] });
        },
    });
};
