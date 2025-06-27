import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type AddCommentResponse = {
    id: string;           // dispute ID
    status: number;       // updated dispute status
    latestComment: {
        body: string;
        createdAt: string;
        authorUser: string;
    };
};

/** POST /disputes/{id}/comments */
const addDisputeComment = async (disputeId: string, comment: string): Promise<AddCommentResponse> => {
    const { data } = await api.post<ApiResponse<AddCommentResponse>>(
        `/disputes/${disputeId}/comments`,
        { comment }
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to add comment');
    }

    return data.data;
};

export const useAddDisputeComment = (disputeId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (comment: string) => addDisputeComment(disputeId, comment),
        onSuccess: () => {
            // Refetch the dispute detail so new comment shows up
            queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
        },
    });
};
