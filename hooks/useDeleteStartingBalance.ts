import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const deleteStartingBalance = async ({
    driverId,
    year,
}: {
    driverId: string;
    year: number;
}): Promise<void> => {
    await api.delete(`/drivers/${driverId}/starting-balances/${year}`);
};

export const useDeleteStartingBalance = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, { driverId: string; year: number }>({
        mutationFn: deleteStartingBalance,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['starting-balances', variables.driverId] });
        },
    });
};
