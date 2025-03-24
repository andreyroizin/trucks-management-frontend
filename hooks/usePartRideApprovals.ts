import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type ApprovalResponse = {
    message?: string;
};

type ApprovalPayload = {
    id: string;         // part ride ID
    comments?: string;   // optional comment body
};

// 1) Approve
export const useApprovePartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ApprovalPayload) => {
            const { id, comments } = payload;
            const response = await api.post<ApiResponse<ApprovalResponse>>(
                `/partrides/${id}/approve`,
                { comments }
            );
            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Approve request failed.');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partRideDetail'] });
        },
    });
};

// 2) Reject
export const useRejectPartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ApprovalPayload) => {
            const { id, comments } = payload;
            const response = await api.post<ApiResponse<ApprovalResponse>>(
                `/partrides/${id}/reject`,
                { comments }
            );
            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Reject request failed.');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partRideDetail'] });
        },
    });
};

// 3) Request Changes
export const useRequestChangesPartRide = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ApprovalPayload) => {
            const { id, comments } = payload;
            const response = await api.post<ApiResponse<ApprovalResponse>>(
                `/partrides/${id}/changes-requested`,
                { comments }
            );
            if (!response.data.isSuccess) {
                throw new Error(response.data.errors?.[0] || 'Request changes failed.');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partRideDetail'] });
        },
    });
};
