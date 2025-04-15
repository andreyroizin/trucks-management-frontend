import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api'; // Your axios instance
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EmployeeContractDetail = {
    id: string;
    driverId?: string;          // optional
    companyId: string;         // required
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

// --- UPDATE FUNCTION (PUT /employee-contracts/[id]) ---
async function updateEmployeeContract(id: string, payload: EmployeeContractDetail): Promise<void> {
    const res = await api.put<ApiResponse<null>>(`/employee-contracts/${id}`, payload);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to update contract');
    }
}

// --- HOOK: useUpdateEmployeeContract ---
export function useUpdateEmployeeContract(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: EmployeeContractDetail) => updateEmployeeContract(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: 'employeeContracts' });
        },
    });
}
