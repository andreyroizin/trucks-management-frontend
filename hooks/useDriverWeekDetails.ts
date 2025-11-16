'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';         // ← your axios instance
import { ApiResponse } from '@/types/api'; // generic response wrapper

// ─── Types ──────────────────────────────────────────────────────────────
export type WeekExecution = {
    rideId: string;
    date: string;           // ISO string
    clientName: string;
    actualStartTime: string; // "08:00"
    actualEndTime: string;   // "16:30"
    actualRestTime: string;  // "00:30"
    totalHours: number;
    compensation: number;   // Total compensation (hourly + additional)
    hourlyCompensation: number;        // Base wage (hours × hourly rate)
    additionalCompensation: number;    // All allowances (NOT including hourly)
    exceedingContainerWaitingTime: number; // Container overtime for this ride (0 if none)
};

export type DriverWeekDetails = {
    weekApprovalId: string;  // ✅ Critical for signing
    year: number;
    weekNumber: number;
    status: number;          // 0 = PendingAdmin, 1 = PendingDriver, 2 = Signed, 3 = Invalidated
    totalHours: number;
    totalCompensation: number;
    adminAllowedAt?: string; // When admin submitted to driver
    executions: WeekExecution[]; // ✅ Ride executions instead of partrides
};

// ─── Fetcher ────────────────────────────────────────────────────────────
const fetchDriverWeekDetails = async (year: number, weekNumber: number) => {
    const { data } = await api.get<ApiResponse<DriverWeekDetails>>(
        `/rides/drivers/week/details?year=${year}&weekNumber=${weekNumber}` // ✅ Updated to use ride execution endpoint
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
