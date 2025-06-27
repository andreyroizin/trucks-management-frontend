import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type AcceptResponse = {
    id: string;   // dispute id
    status: number;
    acceptedAtUtc: string;
};

const acceptDispute = async (id: string): Promise<AcceptResponse> => {
    const { data } = await api.post<ApiResponse<AcceptResponse>>(
        `/disputes/${id}/accept`
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to accept dispute');
    }
    return data.data;
};

export const useAcceptDispute = (id: string) => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: () => acceptDispute(id),
        onSuccess: () => {
            // refresh the single dispute and any listing caches
            qc.invalidateQueries({ queryKey: ['dispute', id] });
            qc.invalidateQueries({ queryKey: ['disputes'] });
        },
    });
};