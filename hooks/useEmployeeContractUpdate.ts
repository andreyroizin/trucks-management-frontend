import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api'; // Your axios instance
import { ApiResponse } from '@/types/api';

import type { ContractType } from './useCreateEmployeeContract';

// --- TYPES ---
export type EmployeeContractDetail = {
    id: string;
    driverId?: string;
    companyId: string;
    contractType?: ContractType;
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
    companyName: string;
    employerName: string;
    companyAddress?: string;
    companyPostcode?: string;
    companyCity?: string;
    companyPhoneNumber?: string;
    companyBtw?: string;
    companyKvk?: string;

    // ZZP fields
    zzpBtwNumber?: string;
    zzpKvkNumber?: string;
    zzpHourlyRateExclBtw?: number;
    zzpBtwPercentage?: number;
    zzpMediationFeePerWeek?: number;
    zzpContractNumber?: string;
    zzpWorkDescription?: string;
    zzpLocation?: string;

    // Inleen fields
    inleenLendingCompanyId?: string;
    inleenBorrowingCompanyId?: string;
    inleenStartDate?: string | null;
    inleenEndDate?: string | null;
    inleenHourlyRate?: number;
    inleenWorkDescription?: string;
    inleenLocation?: string;

    // BriefLoonschaal fields
    briefMonthlySalary?: number;
    briefGrade?: string;
    briefExpectedMonthlyHours?: number;

    // Raam fields
    raamContractNumber?: string;
    raamOpdrachtgeverName?: string;
    raamOpdrachtgeverKvk?: string;
    raamOpdrachtgeverAddress?: string;
    raamOpdrachtgeverCity?: string;
    raamWorkDescription?: string;
    raamLocation?: string;
    raamHourlyRateExclBtw?: number;
    raamBtwPercentage?: number;
    raamPaymentTermDays?: string;
    raamStartDate?: string | null;
    raamEndDate?: string | null;

    // Bemiddeling fields
    bemiddelingContractNumber?: string;
    bemiddelingOpdrachtnemerKvk?: string;
    bemiddelingOpdrachtnemerBtw?: string;
    bemiddelingWorkDescription?: string;
    bemiddelingLocation?: string;
    bemiddelingHourlyRateExclBtw?: number;
    bemiddelingBtwPercentage?: number;
    bemiddelingMediationFeePerWeek?: number;
    bemiddelingPaymentTermDays?: string;
    bemiddelingStartDate?: string | null;
    bemiddelingEndDate?: string | null;
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
