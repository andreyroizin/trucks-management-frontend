'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api'; // or wherever your axios instance is
import { ApiResponse } from '@/types/api';

// POST body structure
export type CreateEmployeeContractInput = {
    driverId?: string;
    companyId?: string;

    nightHoursAllowed?: boolean;
    kilometersAllowanceAllowed?: boolean;
    commuteKilometers?: number;

    employeeFirstName: string;  // required
    employeeLastName: string;   // required
    employeeAddress?: string;
    employeePostcode?: string;
    employeeCity?: string;
    dateOfBirth?: string | null;
    bsn?: string;
    dateOfEmployment?: string | null;
    lastWorkingDay?: string | null;

    function?: string;
    probationPeriod?: string;
    workweekDuration?: number;
    weeklySchedule?: string;
    workingHours?: string;
    noticePeriod?: string;
    compensationPerMonthExclBtw?: number;
    compensationPerMonthInclBtw?: number;
    payScale?: string;
    payScaleStep?: number;
    hourlyWage100Percent?: number;
    deviatingWage?: number;
    travelExpenses?: number;
    maxTravelExpenses?: number;
    vacationAge?: number;
    vacationDays?: number;
    atv?: number;
    vacationAllowance?: number;

    companyName: string;   // required
    employerName: string;  // required
    companyAddress?: string;
    companyPostcode?: string;
    companyCity?: string;
    companyPhoneNumber?: string;
    companyBtw?: string;
    companyKvk?: string;
};

// POST function
async function createEmployeeContract(payload: CreateEmployeeContractInput): Promise<void> {
    const res = await api.post<ApiResponse<null>>('/employee-contracts', payload);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to create employee contract');
    }
}

// Hook
export function useCreateEmployeeContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEmployeeContract,
        onSuccess: () => {
            // Invalidate or refetch any queries needed
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}
