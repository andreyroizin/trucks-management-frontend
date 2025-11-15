import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { RegenerateContractResponse } from '@/types/driverContract';
import axios from 'axios';

/**
 * Hook to manually regenerate a driver's contract (Admin only)
 * Creates a new contract version and marks the current one as superseded
 * @param driverId - The ID of the driver
 */
export const useRegenerateContract = () => {
    const queryClient = useQueryClient();

    return useMutation<RegenerateContractResponse, Error, string>({
        mutationFn: async (driverId: string) => {
            try {
                const response = await api.post<ApiResponse<RegenerateContractResponse>>(
                    `/drivers/${driverId}/contracts/regenerate`
                );

                if (!response.data.isSuccess) {
                    throw new Error(response.data.errors?.[0] || 'Failed to regenerate contract');
                }

                return response.data.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(
                        '[useRegenerateContract] Axios error while regenerating contract',
                        {
                            status: error.response?.status,
                            data: error.response?.data,
                            message: error.message,
                        }
                    );
                    // Extract error message from axios error response
                    const errorMessage =
                        error.response?.data?.errors?.[0] ||
                        error.response?.data?.message ||
                        error.message ||
                        'Failed to regenerate contract';
                    throw new Error(errorMessage);
                } else {
                    console.error('[useRegenerateContract] Unexpected error while regenerating contract', error);
                }
                throw error instanceof Error ? error : new Error('Failed to regenerate contract');
            }
        },
        onSuccess: (data, driverId) => {
            // Invalidate contract-related queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['driverContractVersions', driverId] });
            queryClient.invalidateQueries({ queryKey: ['driverLatestContract', driverId] });
            queryClient.invalidateQueries({ queryKey: ['driverContractVersion'] });
            // Also invalidate driver data in case it affects the driver detail page
            queryClient.invalidateQueries({ queryKey: ['driverWithContract', driverId] });
        },
    });
};

