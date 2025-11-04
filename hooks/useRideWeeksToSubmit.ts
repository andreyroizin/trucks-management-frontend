import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type DriverWeekSummary = {
  id: string; // weekApprovalId - CRITICAL for admin actions
  driverId: string;
  year: number;
  weekNumber: number;
  periodNumber: number;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
  };
  executionCount: number;
  totalHours: number;
  totalCompensation: number;
  weekStartDate: string; // "yyyy-MM-dd"
  isSubmitted: boolean;
  status: 'PendingAdmin' | 'PendingDriver' | 'Signed' | 'Invalidated';
  summaryStatus: 'All Approved' | 'Has Pending' | 'Has Disputes' | 'Has Rejected' | 'Unknown';
  submittedAt?: string;
  signedAt?: string;
  pendingCount: number;
  disputeCount: number;
  rejectedCount: number;
};

export type WeekExecutionDetails = {
  executionId: string;
  rideId: string;
  date: string;
  clientName: string;
  hours: number;
  hoursCode: {
    id: string;
    name: string;
  } | null;
  compensation: number;
};

export type WeekDetails = DriverWeekSummary & {
  executions: WeekExecutionDetails[];
};

export type WeekSubmissionResult = {
  id: string;
  driverId: string;
  year: number;
  weekNumber: number;
  periodNumber: number;
  status: string;
  message: string;
};

export type AllowDriverResult = {
  id: string;
  driverId: string;
  year: number;
  weekNumber: number;
  newStatus: string;
  message: string;
};

/* ------------------------------------------------------------------ */
/* Fetchers                                                            */
/* ------------------------------------------------------------------ */

const fetchRideWeeksToSubmit = async (driverId?: string): Promise<DriverWeekSummary[]> => {
  const params = new URLSearchParams();
  if (driverId) params.set('driverId', driverId);

  const res = await api.get<ApiResponse<DriverWeekSummary[]>>(
    `/rides/weeks-to-submit${params.toString() ? `?${params.toString()}` : ''}`,
  );

  if (res.data.isSuccess) return res.data.data || [];
  throw new Error(res.data.errors?.[0] || 'Failed to fetch weeks to submit');
};

const fetchWeekDetails = async (weekStartDate: string, driverId?: string): Promise<WeekDetails> => {
  const params = new URLSearchParams();
  if (driverId) params.set('driverId', driverId);

  const res = await api.get<ApiResponse<WeekDetails>>(
    `/rides/week/${weekStartDate}${params.toString() ? `?${params.toString()}` : ''}`,
  );

  if (res.data.isSuccess) return res.data.data;
  throw new Error(res.data.errors?.[0] || 'Failed to fetch week details');
};

const submitWeek = async (weekStartDate: string): Promise<WeekSubmissionResult> => {
  const res = await api.put<ApiResponse<WeekSubmissionResult>>(
    `/rides/week/${weekStartDate}/submit`,
  );

  if (res.data.isSuccess) return res.data.data;
  throw new Error(res.data.errors?.[0] || 'Failed to submit week');
};

// NEW: Admin submits week to driver for signing
const allowDriverForWeek = async (weekApprovalId: string): Promise<AllowDriverResult> => {
  const res = await api.put<ApiResponse<AllowDriverResult>>(
    `/rides/weeks-to-submit/${weekApprovalId}/allow-driver`,
  );

  if (res.data.isSuccess) return res.data.data;
  throw new Error(res.data.errors?.[0] || 'Failed to submit week to driver');
};

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

// Get driver's weeks to submit (for drivers) or all weeks (for admins)
export const useRideWeeksToSubmit = (driverId?: string) =>
  useQuery({
    queryKey: ['rideWeeksToSubmit', driverId],
    queryFn: () => fetchRideWeeksToSubmit(driverId),
  });

// Get detailed week information
export const useRideWeekDetails = (weekStartDate: string, driverId?: string) =>
  useQuery({
    queryKey: ['rideWeekDetails', weekStartDate, driverId],
    queryFn: () => fetchWeekDetails(weekStartDate, driverId),
    enabled: !!weekStartDate,
  });

// Submit a week for approval (driver fallback - rarely used)
export const useSubmitRideWeek = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitWeek,
    onSuccess: () => {
      // Invalidate weeks list to refresh status
      queryClient.invalidateQueries({ queryKey: ['rideWeeksToSubmit'] });
      queryClient.invalidateQueries({ queryKey: ['rideWeekDetails'] });
    },
  });
};

// NEW: Admin submits week to driver for signing (main workflow)
export const useAllowDriverForWeek = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: allowDriverForWeek,
    onSuccess: () => {
      // Invalidate weeks list to refresh status
      queryClient.invalidateQueries({ queryKey: ['rideWeeksToSubmit'] });
      queryClient.invalidateQueries({ queryKey: ['rideWeekDetails'] });
    },
  });
};
