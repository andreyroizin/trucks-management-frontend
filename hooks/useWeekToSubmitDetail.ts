import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type WeekPartRide = {
    id: string;
    date: string;                 // ISO string
    hours: number;
    hoursCode: {
        id: string;
        name: string;
    };
    forecastedEarnings: number;
};

export type WeekToSubmitDetail = {
    id: string;
    year: number;
    weekNr: number;
    periodNr: number;
    status: number;               // raw status enum
    driver: {
        driverId: string;
        firstName: string;
        lastName: string;
    };
    totalHours: number;
    totalForecasted: number;
    partRides: WeekPartRide[];
    vacationHoursUsed: number;
    vacationHoursLeft: number;
};

/* ------------------------------------------------------------------ */
/* Fetcher                                                             */
/* ------------------------------------------------------------------ */

const fetchWeekToSubmitDetail = async (id: string): Promise<WeekToSubmitDetail> => {
    const res = await api.get<ApiResponse<WeekToSubmitDetail>>(`/weeks-to-submit/${id}`);

    if (res.data.isSuccess) return res.data.data;
    throw new Error(res.data.errors?.[0] || 'Failed to fetch week-to-submit detail');
};

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export const useWeekToSubmitDetail = (id: string, enabled = !!id) =>
    useQuery({
        queryKey: ['weekToSubmitDetail', id],
        queryFn: () => fetchWeekToSubmitDetail(id),
        enabled,               // don’t run if id is falsy
        placeholderData: (prev) => prev,
    });
