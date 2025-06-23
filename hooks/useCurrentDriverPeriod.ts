import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import {WeekInPeriod} from "@/hooks/useDriverPeriodDetail";

/* ----------  Types returned by the endpoint  ---------- */
export type PartRide = {
    id: string;
    date: string;          // ISO-8601
    start: string;         // HH:mm:ss
    end: string;           // HH:mm:ss
    kilometers: number;
    decimalHours: number;
    remark: string;
    status: number;
};

export type CurrentDriverPeriod = {
    year: number;           // 2025
    periodNr: number;       // 6  → displayed as “2025-P-06”
    status: number;         // 0 = on-going, 1 = ready, 2 = signed
    fromDate: string;       // ISO
    toDate: string;         // ISO
    weeks: WeekInPeriod[];
};

/* ------------------------------------------------------- */

async function fetchCurrentPeriod() {
    const res = await api.get<ApiResponse<CurrentDriverPeriod>>(
        '/drivers/periods/current'
    );

    if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.errors?.[0] || 'Failed to load period');
    }
    return res.data.data;
}

/**
 * Hook: fetches the current driver period.
 */
export function useCurrentDriverPeriod() {
    return useQuery({
        queryKey: ['driverPeriod', 'current'],
        queryFn: fetchCurrentPeriod,
        placeholderData: keepPreviousData => keepPreviousData, // TanStack v5 syntax
        staleTime: 5 * 60 * 1000, // 5 min
    });
}
