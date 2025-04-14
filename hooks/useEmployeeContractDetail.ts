import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api'; // Or your axios instance
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EmployeeContractDetail = {
    id: string;
    driver?: {
        id: string;
        fullName: string;
        aspNetUserId: string;
    };
    company?: {
        id: string;
        name: string;
    };
    releaseVersion?: number | null;
    nightHoursAllowed?: boolean;
    kilometersAllowanceAllowed?: boolean;
    commuteKilometers?: number;
    employeeFirstName: string;
    employeeLastName: string;
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
    companyName?: string;
    employerName?: string;
    companyAddress?: string;
    companyPostcode?: string;
    companyCity?: string;
    companyPhoneNumber?: string;
    companyBtw?: string;
    companyKvk?: string;
};

// --- FETCH DETAIL ---
async function fetchContractDetail(id: string): Promise<EmployeeContractDetail> {
    const res = await api.get<ApiResponse<EmployeeContractDetail>>(`/employee-contracts/${id}`);
    if (res.data.isSuccess) {
        return res.data.data;
    }
    throw new Error(res.data.errors?.[0] || 'Failed to fetch contract detail');
}

// --- HOOK: useEmployeeContractDetail ---
export function useEmployeeContractDetail(id: string) {
    return useQuery({
        queryKey: ['employeeContractDetail', id],
        queryFn: () => fetchContractDetail(id),
    });
}