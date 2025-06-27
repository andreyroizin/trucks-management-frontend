import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ───────── Types ───────── */
export type NewDisputeResponse = {
    id: string;
    correctionHours: number;
    status: number;
    createdAtUtc: string;
    comments: {
        id: string;
        body: string;
        createdAt: string;
        authorFirstId: string | null;
    }[];
};

export type CreateDisputePayload = {
    correctionHours: number;
    comment?: string;             // ← new field
};

/* ─────── Fetcher ─────── */
const createDispute = async (
    partRideId: string,
    payload: CreateDisputePayload
): Promise<NewDisputeResponse> => {
    const { data } = await api.post<ApiResponse<NewDisputeResponse>>(
        `/partrides/${partRideId}/disputes`,
        payload
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to create dispute');
    }
    return data.data;
};

/* ─────── Hook ─────── */
export const useCreatePartRideDispute = (partRideId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateDisputePayload) =>
            createDispute(partRideId, payload),

        onSuccess: () => {
            // refresh data that might include this dispute
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
            queryClient.invalidateQueries({ queryKey: ['partRide', partRideId] });
        },
    });
};
