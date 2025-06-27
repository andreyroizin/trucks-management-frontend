import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ──────────────── Types ──────────────── */
export type DisputeComment = {
    id: string;
    body: string;
    createdAt: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
};

export type PartRideDispute = {
    id: string;
    correctionHours: number;
    createdAtUtc: string;
    status: number;
    closedAtUtc: string | null;
    comments: DisputeComment[];
};

export type PartRideDisputesResponse = {
    partRideId: string;
    disputes: PartRideDispute[];
};

/* ─────────────── Fetcher ─────────────── */
const fetchPartRideDisputes = async (
    partRideId: string
): Promise<PartRideDisputesResponse> => {
    const { data } = await api.get<ApiResponse<PartRideDisputesResponse>>(
        `/partrides/${partRideId}/disputes`
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to fetch disputes');
    }
    return data.data;
};

/* ─────────────── Hook ─────────────────── */
export const usePartRideDisputes = (partRideId: string) =>
    useQuery({
        queryKey: ['partRideDisputes', partRideId],
        queryFn: () => fetchPartRideDisputes(partRideId),
        enabled: !!partRideId, // do nothing if id is undefined / null
    });
