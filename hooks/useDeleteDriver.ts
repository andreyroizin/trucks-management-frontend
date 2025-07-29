import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

// Delete Driver Response Type
export interface DeleteDriverResponse {
    success: boolean;
    data: {
        driverId: string;
        message: string;
        terminationDate: string;
    };
    message: string;
}

// --- DELETE DRIVER FUNCTION ---
const deleteDriverWithContract = async (driverId: string): Promise<DeleteDriverResponse> => {
    const response = await api.delete<DeleteDriverResponse>(`/drivers/${driverId}/with-contract`);
    return response.data;
};

// --- HOOK TO DELETE A DRIVER ---
export const useDeleteDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<DeleteDriverResponse, Error, string>({
        mutationFn: (driverId: string) => deleteDriverWithContract(driverId),
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['driverWithContract'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
};
