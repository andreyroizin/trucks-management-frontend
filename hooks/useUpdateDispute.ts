import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { DisputeDetail } from '@/hooks/useDisputeById'; // adjust path if needed

/* ---------- Request / Response types ---------- */
export type UpdateDisputePayload = {
    correctionHours: number;
};

type UpdateDisputeResponse = DisputeDetail; // API returns full updated dispute

/* ---------- Fetcher ---------- */
const updateDispute = async (
    id: string,
    payload: UpdateDisputePayload
): Promise<UpdateDisputeResponse> => {
    const { data } = await api.put<ApiResponse<UpdateDisputeResponse>>(
        `/disputes/${id}`,
        payload
    );

    if (!data.isSuccess || !data.data) {
        throw new Error(data.errors?.[0] || 'Failed to update dispute');
    }
    return data.data;
};

/* ---------- Hook ---------- */
export const useUpdateDispute = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, correctionHours }: { id: string; correctionHours: number }) =>
            updateDispute(id, { correctionHours }),

        // Optimistic: update the cache right away
        onMutate: async ({ id, correctionHours }: { id: string; correctionHours: number }) => {
            await queryClient.cancelQueries({ queryKey: ['dispute', id] });
            const previous = queryClient.getQueryData<DisputeDetail>(['dispute', id]);
            if (previous) {
                queryClient.setQueryData(['dispute', id], {
                    ...previous,
                    correctionHours,
                    partRide: {
                        ...previous.partRide,
                        newDecimalHours: previous.partRide.decimalHours + correctionHours,
                    },
                });
            }
            return { previous, id };
        },

        onError: (_err, _vars, ctx) => {
            if (ctx?.previous && ctx?.id) {
                queryClient.setQueryData(['dispute', ctx.id], ctx.previous);
            }
        },

        onSuccess: (updated) => {
            // Ensure fresh data
            queryClient.setQueryData(['dispute', updated.id], updated);
            // Invalidate any lists that include disputes
            queryClient.invalidateQueries({ queryKey: ['disputes'] });
        },
    });
};