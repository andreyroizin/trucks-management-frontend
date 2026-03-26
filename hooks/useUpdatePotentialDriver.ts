import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PotentialDriver, UpdatePotentialDriverInput } from '@/types/potentialDriver';

const updatePotentialDriver = async ({
    id,
    data,
}: {
    id: string;
    data: UpdatePotentialDriverInput;
}): Promise<PotentialDriver> => {
    const response = await api.put<ApiResponse<PotentialDriver>>(`/potential-drivers/${id}`, data);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to update potential driver');
};

export const useUpdatePotentialDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<PotentialDriver, Error, { id: string; data: UpdatePotentialDriverInput }>({
        mutationFn: updatePotentialDriver,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['potentialDrivers'] });
            queryClient.invalidateQueries({ queryKey: ['potentialDriver', id] });
        },
    });
};
