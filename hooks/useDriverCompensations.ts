'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api'; // or wherever your axios instance is
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CompensationSettings = {
    percentageOfWork: number;
    nightHoursAllowed: boolean;
    nightHours19Percent: boolean;
    driverRatePerHour: number;
    nightAllowanceRate: number;
    kilometerAllowanceEnabled: boolean;
    kilometersOneWayValue: number;
    kilometersMin: number;
    kilometersMax: number;
    kilometerAllowance: number;
    salary4Weeks: number;
    weeklySalary: number;
    dateOfEmployment: string; // e.g. '2024-12-23'
};

export type DriverCompResponse = {
    id: string;
    aspNetUserId: string;
    companyId: string;
    compensationSettings: CompensationSettings;
};

// --- GET: /users/[id]/driver/compensations ---
async function fetchCompensations(userId: string): Promise<DriverCompResponse> {
    const res = await api.get<ApiResponse<DriverCompResponse>>(`/users/${userId}/driver/compensations`);
    if (res.data.isSuccess) {
        return res.data.data;
    }
    throw new Error(res.data.errors?.[0] || 'Failed to fetch driver compensations');
}

// --- HOOK: GET ---
export function useGetDriverCompensations(userId: string) {
    return useQuery({
        queryKey: ['driverCompensations', userId],
        queryFn: () => fetchCompensations(userId),
        placeholderData: () => undefined, // or 'keepPreviousData'
    });
}

// --- PUT: /users/[id]/driver/compensations ---
async function putCompensations(userId: string, payload: CompensationSettings): Promise<void> {
    const res = await api.put<ApiResponse<null>>(`/users/${userId}/driver/compensations`, payload);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to update driver compensations');
    }
}

// --- HOOK: UPDATE ---
export function useUpdateDriverCompensations() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: CompensationSettings }) =>
            putCompensations(userId, data),
        onSuccess: () => {
            // Example invalidation
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}
