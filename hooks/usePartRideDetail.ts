import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type PartRideDetail = {
    id: string;
    date: string;        // e.g. "2024-03-06T00:00:00Z"
    start: string;       // e.g. "08:00:00"
    end: string;         // e.g. "16:30:00"
    rest?: string;
    kilometers?: number;
    costs?: number;
    employer?: string;
    client?: {
        id: string;
        name: string;
    };
    company?: {
        id: string;
        name: string;
    };
    driver?: {
        id: string;
        aspNetUserId: string;
        firstName: string;
        lastName: string;
    };
    car?: {
        id: string;
        licensePlate: string;
    };
    rate?: {
        id: string;
        name: string;
    };
    surcharge?: {
        id: string;
        value: number;
    };
    charter?: {
        id: string;
        name: string;
    };
    unit?: {
        id: string;
        value: string;
    };
    ride?: {
        id: string;
        name: string;
    };
    hoursOption?:  {
        id: string;
        name: string;
    };
    hoursCode?:  {
        id: string;
        name: string;
    };
    day: number;
    weekNumber: number;
    decimalHours: number;
    costsDescription?: string;
    turnover?: number;
    remark?: string;
    correctionTotalHours?: number;
    taxFreeCompensation?: number;
    standOver?: number;
    nightAllowance?: number;
    kilometerReimbursement?: number;
    extraKilometers?: number;
    consignmentFee?: number;
    saturdayHours?: number;
    sundayHolidayHours?: number;
    variousCompensation?: number;
};

// --- FETCH FUNCTION ---
const fetchPartRideDetail = async (id: string): Promise<PartRideDetail> => {
    const response = await api.get<ApiResponse<PartRideDetail>>(`/partrides/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to load part ride detail');
};

// --- HOOK ---
export const usePartRideDetail = (id: string) => {
    return useQuery({
        queryKey: ['partRideDetail', id],
        queryFn: () => fetchPartRideDetail(id),
    });
};
