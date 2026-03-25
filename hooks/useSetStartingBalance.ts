import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { DriverStartingBalanceDto, SetStartingBalanceRequest } from '@/types/startingBalance';

const setStartingBalance = async ({
    driverId,
    request,
}: {
    driverId: string;
    request: SetStartingBalanceRequest;
}): Promise<DriverStartingBalanceDto> => {
    const response = await api.post<ApiResponse<DriverStartingBalanceDto>>(
        `/drivers/${driverId}/starting-balances`,
        request
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to save starting balance');
};

export const useSetStartingBalance = () => {
    const queryClient = useQueryClient();

    return useMutation<DriverStartingBalanceDto, Error, { driverId: string; request: SetStartingBalanceRequest }>({
        mutationFn: setStartingBalance,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['starting-balances', variables.driverId] });
        },
    });
};
