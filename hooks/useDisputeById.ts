import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type PartRide = {
    id: string;
    date: string;
    decimalHours: number;
    newDecimalHours: number;
};

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

export type DisputeDetail = {
    id: string;
    partRide: PartRide;
    correctionHours: number;
    status: number;
    createdAtUtc: string;
    closedAtUtc: string | null;
    comments: DisputeComment[];
};

const fetchDisputeById = async (id: string): Promise<DisputeDetail> => {
    const response = await api.get<ApiResponse<DisputeDetail>>(`/disputes/${id}`);

    if (response.data.isSuccess && response.data.data) {
        return response.data.data;
    }

    throw new Error(response.data.errors?.[0] || 'Failed to fetch dispute');
};

export const useDisputeById = (id: string) => {
    return useQuery({
        queryKey: ['dispute', id],
        queryFn: () => fetchDisputeById(id),
        enabled: !!id, // avoids fetching if id is undefined/null
    });
};
