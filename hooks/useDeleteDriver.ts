import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface DeleteDriverResponse {
    isSuccess: boolean;
    statusCode: number;
    data: {
        driverId: string;
        message: string;
        terminationDate: string;
        terminationReason?: string;
    };
    errors: string[] | null;
}

export type DeleteDriverParams = {
    driverId: string;
    reason?: string;
};

const deleteDriverWithContract = async ({ driverId, reason }: DeleteDriverParams): Promise<DeleteDriverResponse> => {
    const response = await api.delete<DeleteDriverResponse>(`/drivers/${driverId}/with-contract`, {
        data: reason ? { reason } : undefined,
    });
    return response.data;
};

export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<DeleteDriverResponse, Error, DeleteDriverParams>({
        mutationFn: deleteDriverWithContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['driverWithContract'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
};
