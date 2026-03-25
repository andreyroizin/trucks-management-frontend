import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PotentialDriverPrefill } from '@/types/potentialDriver';

const fetchPrefill = async (prospectId: string): Promise<PotentialDriverPrefill> => {
    const response = await api.get<ApiResponse<PotentialDriverPrefill>>(`/potential-drivers/${prospectId}/prefill`);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch prefill data');
};

const markConverted = async ({
    prospectId,
    driverId,
}: {
    prospectId: string;
    driverId: string;
}): Promise<void> => {
    await api.patch(`/potential-drivers/${prospectId}/mark-converted?driverId=${driverId}`);
};

export const usePotentialDriverPrefill = (prospectId: string) => {
    return {
        getPrefill: () => fetchPrefill(prospectId),
    };
};

export const useMarkProspectConverted = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { prospectId: string; driverId: string }>({
        mutationFn: markConverted,
        onSuccess: (_, { prospectId }) => {
            queryClient.invalidateQueries({ queryKey: ['potentialDrivers'] });
            queryClient.invalidateQueries({ queryKey: ['potentialDriver', prospectId] });
        },
    });
};
