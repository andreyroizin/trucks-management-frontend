import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type PublicContract = {
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
    releaseVersion?: number;
    nightHoursAllowed?: boolean;
    kilometersAllowanceAllowed?: boolean;
    commuteKilometers?: number;
    employeeFirstName: string;
    employeeLastName: string;
    employeeAddress?: string | null;
    employeePostcode?: string | null;
    employeeCity?: string | null;
    dateOfBirth?: string | null; // "1985-05-20T00:00:00Z"
    bsn?: string | null;
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
    companyAddress?: string | null;
    companyPostcode?: string | null;
    companyCity?: string | null;
    companyPhoneNumber?: string | null;
    companyBtw?: string | null;
    companyKvk?: string | null;
};

// --- FETCH FUNCTION ---
async function fetchPublicContract(contractId: string, accessCode: string): Promise<PublicContract> {
    // GET /employee-contracts/[id]/public?access=[code]
    const res = await api.get<ApiResponse<PublicContract>>(`/employee-contracts/${contractId}/public?access=${accessCode}`);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to fetch public contract');
    }
    return res.data.data;
}

// --- HOOK ---
export function usePublicContractDetail(contractId: string, accessCode: string) {
    return useQuery({
        queryKey: ['publicContractDetail', contractId, accessCode],
        queryFn: () => fetchPublicContract(contractId, accessCode),
        placeholderData: () => undefined, // or 'keepPreviousData'
        enabled: !!contractId && !!accessCode, // only fetch if both exist
    });
}
