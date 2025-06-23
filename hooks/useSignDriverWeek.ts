import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

type SignDriverWeekResponse = {
    message: string;
    weekApprovalId: string;
    status: number;
    driverSignedAt: string;
};

type SignWeekPayload = {
    year: number;
    weekNumber: number;
};

const signDriverWeekRequest = async ({ year, weekNumber }: SignWeekPayload): Promise<SignDriverWeekResponse> => {
    const response = await api.post<ApiResponse<SignDriverWeekResponse>>(
        `/drivers/week/sign?year=${year}&weekNumber=${weekNumber}`
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
