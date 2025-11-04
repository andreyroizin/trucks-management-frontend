import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type SignDriverWeekResponse = {
    id: string;
    driverId: string;
    year: number;
    weekNumber: number;
    newStatus: string;
    signedAt: string;
    message: string;
};

const signDriverWeekRequest = async (weekApprovalId: string): Promise<SignDriverWeekResponse> => {
    const response = await api.put<ApiResponse<SignDriverWeekResponse>>(
        `/rides/weeks-to-submit/${weekApprovalId}/sign` // ✅ Updated to use ride execution endpoint
    );

    if (response.data.isSuccess && response.data.data) {
        return response.data.data;
    }

    throw new Error(response.data.errors?.[0] || 'Failed to sign work week');
};

export const useSignDriverWeek = () => {
    return useMutation({
        mutationFn: signDriverWeekRequest,
    });
};
