'use client';

import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { DriverWeekDetails } from './useDriverWeekDetails';
import { getIso8601WeekOfYear } from '@/utils/Iso8601WeekOfYear';

/* ---------- types ------------------------------------------------- */
export type RideExecution = {
    rideId: string;
    date: string;
    clientName: string;
    actualStartTime: string;
    actualEndTime: string;
    actualRestTime: string;
    totalHours: number;
    compensation: number; // Full total (from backend)
    hourlyCompensation?: number; // Base wage
    additionalCompensation?: number; // Sum of all allowances (calculated or from backend)
    exceedingContainerWaitingTime?: number; // Container overtime hours (for display only)
};

export type WeekInPeriod = {
    weekInPeriod: number;   // 1-4
    weekNumber: number;     // ISO week number (21, 22, …)
    totalDecimalHours: number;
    status: number;
    executions: RideExecution[]; // ✅ Changed from partRides to executions
    totalCompensation: number;   // ✅ Added compensation tracking
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

/* ---------- helper to get Monday of ISO week --------------------- */
const getIsoWeekMonday = (year: number, weekNumber: number): Date => {
    // Start with January 4th of the given year (always in week 1)
    const jan4 = new Date(year, 0, 4);
    
    // Find the Monday of week 1
    const jan4Day = jan4.getDay();
    const daysToMonday = jan4Day === 0 ? -6 : 1 - jan4Day; // Sunday = 0, Monday = 1
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() + daysToMonday);
    
    // Add weeks to get to the target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
    
    return targetMonday;
};

/* ---------- helper to fetch individual week details -------------- */
const fetchWeekDetails = async (year: number, weekNumber: number): Promise<DriverWeekDetails | null> => {
    try {
        const { data } = await api.get<ApiResponse<DriverWeekDetails>>(
            `/rides/drivers/week/details?year=${year}&weekNumber=${weekNumber}`
        );
        
        if (data.isSuccess && data.data) {
            return data.data;
        }
        return null; // Week has no data
    } catch (error) {
        return null; // Week has no data or error
    }
};

/* ---------- fetcher ----------------------------------------------- */
const fetchDriverPeriodDetail = async (periodKey: string): Promise<DriverPeriodDetail> => {
    // Parse periodKey: "2025-11" -> year=2025, periodNr=11
    const [yearStr, periodStr] = periodKey.split('-');
    const year = parseInt(yearStr, 10);
    const periodNr = parseInt(periodStr, 10);
    
    if (!year || !periodNr) {
        throw new Error('Invalid period key format');
    }
    
    // Calculate the 4 weeks in this period
    const baseWeek = (periodNr - 1) * 4 + 1;
    const weekNumbers = [baseWeek, baseWeek + 1, baseWeek + 2, baseWeek + 3];
    
    // Fetch all 4 weeks in parallel
    const weekPromises = weekNumbers.map(weekNumber => fetchWeekDetails(year, weekNumber));
    const weekResults = await Promise.all(weekPromises);
    
    // Build period data
    const weeks: WeekInPeriod[] = weekResults.map((weekData, index) => {
        const weekNumber = weekNumbers[index];
        
        if (!weekData) {
            // Week has no data
            return {
                weekInPeriod: index + 1,
                weekNumber,
                totalDecimalHours: 0,
                status: 0, // No data
                executions: [],
                totalCompensation: 0,
            };
        }
        
        // Convert executions to the expected format
        const executions: RideExecution[] = weekData.executions.map(exec => ({
            rideId: exec.rideId,
            date: exec.date,
            clientName: exec.clientName,
            actualStartTime: exec.actualStartTime,
            actualEndTime: exec.actualEndTime,
            actualRestTime: exec.actualRestTime,
            totalHours: exec.totalHours,
            compensation: exec.compensation,
        }));
        
        return {
            weekInPeriod: index + 1,
            weekNumber,
            totalDecimalHours: weekData.totalHours,
            status: weekData.status,
            executions,
            totalCompensation: weekData.totalCompensation,
        };
    });
    
    // Calculate period totals
    const totalDecimalHours = weeks.reduce((sum, week) => sum + week.totalDecimalHours, 0);
    const totalEarnings = weeks.reduce((sum, week) => sum + week.totalCompensation, 0);
    
    // Calculate period dates (first Monday to last Sunday)
    const firstMonday = getIsoWeekMonday(year, baseWeek);
    const lastMonday = getIsoWeekMonday(year, baseWeek + 3);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6); // Add 6 days to get Sunday
    
    const fromDate = dayjs(firstMonday).format('YYYY-MM-DD');
    const toDate = dayjs(lastSunday).format('YYYY-MM-DD');
    
    // Determine overall period status
    const hasAnyData = weeks.some(w => w.executions.length > 0);
    const allWeeksSigned = weeks.every(w => w.status === 2 || w.executions.length === 0);
    
    return {
        year,
        periodNr,
        status: !hasAnyData ? 0 : allWeeksSigned ? 2 : 1, // 0=no data, 1=pending, 2=signed
        fromDate,
        toDate,
        totalDecimalHours,
        totalEarnings,
        weeks,
    };
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
