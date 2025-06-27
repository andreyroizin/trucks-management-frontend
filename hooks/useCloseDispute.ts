import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type CloseResponse = {
    id: string;
    status: number;          // presumably now “Closed”
    closedAtUtc: string;
};

const closeDispute = async (id: string): Promise<CloseResponse> => {
    const { data } = await api.post<ApiResponse<CloseResponse>>(
        `/disputes/${id}/close`
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to close dispute');
    }
    return data.data;
};

export const useCloseDispute = (id: string) => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: () => closeDispute(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dispute', id] });
            qc.invalidateQueries({ queryKey: ['disputes'] });
        },
    });
};