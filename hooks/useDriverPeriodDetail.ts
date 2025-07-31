'use client';

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { useQuery } from '@tanstack/react-query';

/* ---------- types ------------------------------------------------- */
export type PartRide = {
    id: string;
    date: string;          // ISO-8601
    start: string;         // HH:mm:ss
    end: string;           // HH:mm:ss
    kilometers: number;
    decimalHours: number;
    hoursCode?: {
        id: string;
        name: string;
    };
    remark: string;
    status: number;
};

export type WeekInPeriod = {
    weekInPeriod: number;   // 1-4
    weekNumber: number;     // ISO week number (21, 22, …)
    totalDecimalHours: number;
    status: number;
    partRides: PartRide[];
};

export interface DriverPeriodDetail {
    year: number;
    periodNr: number;
    status: number;
    fromDate: string;
    toDate: string;
    totalDecimalHours: number;
    totalEarnings: number;
    weeks: WeekInPeriod[];
}
/* ------------------------------------------------------------------ */

/* ---------- fetcher ----------------------------------------------- */
const fetchDriverPeriodDetail = async (periodKey: string): Promise<DriverPeriodDetail> => {
    const res = await api.get<ApiResponse<DriverPeriodDetail>>(`/drivers/periods/${periodKey}`);
    if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.errors?.[0] || 'Period not found.');
    }
    return res.data.data;
};
/* ------------------------------------------------------------------ */

/* ---------- hook -------------------------------------------------- */
export const useDriverPeriodDetail = (periodKey: string) =>
    useQuery({
        queryKey: ['driverPeriod', periodKey],
        queryFn: () => fetchDriverPeriodDetail(periodKey),
        enabled: Boolean(periodKey),           // don’t fire until we have an id
    });
/* ------------------------------------------------------------------ */
