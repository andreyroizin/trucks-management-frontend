'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';         // ← your axios instance
import { ApiResponse } from '@/types/api'; // generic response wrapper

// ─── Types ──────────────────────────────────────────────────────────────
export type WeekRide = {
    id: string;
    date: string;           // ISO string
    decimalHours: number;
    company?: { id: string; name: string } | null;
    client?: { id: string; name: string } | null;
    car?: { id: string; licensePlate: string } | null;
};

export type DriverWeekDetails = {
    weekApprovalId: string;
    week: number;
    year: number;
    startDate: string;       // e.g. 2025-12-22T00:00:00
    endDate: string;         // e.g. 2025-12-28T00:00:00
    status: number;          // 0 = on-going, 1 = ready to sign, 2 = signed
    totalCompensation: number;
    totalHoursWorked: number;
    vacationHoursTaken: number;
    vacationHoursLeft: number;
    rides: WeekRide[];
};

// ─── Fetcher ────────────────────────────────────────────────────────────
const fetchDriverWeekDetails = async (year: number, weekNumber: number) => {
    const { data } = await api.get<ApiResponse<DriverWeekDetails>>(
        `/drivers/week/details?year=${year}&weekNumber=${weekNumber}`
    );

    if (!data.isSuccess) {
        throw new Error(data.errors?.[0] || 'Failed to load week details');
    }

    return data.data;
};

// ─── Hook ───────────────────────────────────────────────────────────────
export const useDriverWeekDetails = (year: number, weekNumber: number) =>
    useQuery({
        queryKey: ['driverWeekDetails', year, weekNumber],
        queryFn: () => fetchDriverWeekDetails(year, weekNumber),
        enabled: !!year && !!weekNumber,
    });
