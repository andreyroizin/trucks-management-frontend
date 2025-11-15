import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import {
    ContractVersion,
    ContractVersionDetail,
    ContractVersionListResponse,
    ContractVersionDetailResponse,
    LatestContractVersionResponse,
} from '@/types/driverContract';

/**
 * Hook to fetch all contract versions for a driver
 * @param driverId - The ID of the driver
 * @param includeSuperseded - Whether to include superseded versions (default: false)
 */
export const useDriverContractVersions = (
    driverId: string,
    includeSuperseded: boolean = false
) => {
    return useQuery<ContractVersion[], Error>({
        queryKey: ['driverContractVersions', driverId, includeSuperseded],
        queryFn: async () => {
            const response = await api.get<ApiResponse<ContractVersionListResponse>>(
                `/drivers/${driverId}/contracts`,
                {
                    params: {
                        includeSuperseded,
                    },
                }
            );

            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Failed to fetch contract versions');
            }

            return response.data.data;
        },
        enabled: !!driverId,
    });
};

/**
 * Hook to fetch the latest contract version for a driver
 * @param driverId - The ID of the driver
 */
export const useDriverLatestContract = (driverId: string) => {
    return useQuery<ContractVersion, Error>({
        queryKey: ['driverLatestContract', driverId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<LatestContractVersionResponse>>(
                `/drivers/${driverId}/contracts/latest`
            );

            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Failed to fetch latest contract');
            }

            return response.data.data;
        },
        enabled: !!driverId,
    });
};

/**
 * Hook to fetch detailed information about a specific contract version
 * @param driverId - The ID of the driver
 * @param versionId - The ID of the contract version
 */
export const useDriverContractVersion = (driverId: string, versionId: string) => {
    return useQuery<ContractVersionDetail, Error>({
        queryKey: ['driverContractVersion', driverId, versionId],
        queryFn: async () => {
            const response = await api.get<ApiResponse<ContractVersionDetailResponse>>(
                `/drivers/${driverId}/contracts/${versionId}`
            );

            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Failed to fetch contract version details');
            }

            return response.data.data;
        },
        enabled: !!driverId && !!versionId,
    });
};

