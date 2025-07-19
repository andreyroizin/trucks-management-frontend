import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AllowDriverResult = {
    id: string;
    year: number;
    weekNr: number;
    newStatus: number;   // 1 = driver allowed, according to backend
};

/* ------------------------------------------------------------------ */
/* Server call                                                         */
/* ------------------------------------------------------------------ */

const allowDriverForWeek = async (id: string): Promise<AllowDriverResult> => {
    const res = await api.put<ApiResponse<AllowDriverResult>>(
        `/weeks-to-submit/${id}/allow-driver`,
    );

    if (res.data.isSuccess) return res.data.data;
    throw new Error(res.data.errors?.[0] || 'Failed to allow driver');
};

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export const useAllowDriverForWeek = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: allowDriverForWeek,
        // Optional: optimistically update list/detail caches
        onSuccess: () => {
            // Invalidate the list so it refetches with new status
            queryClient.invalidateQueries({ queryKey: ['weeksToSubmit'] });
        },
    });
};