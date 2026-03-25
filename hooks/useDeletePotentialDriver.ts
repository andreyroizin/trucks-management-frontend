import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const deletePotentialDriver = async (id: string): Promise<void> => {
    await api.delete(`/potential-drivers/${id}`);
};

export const useDeletePotentialDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: deletePotentialDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['potentialDrivers'] });
        },
    });
};
