import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type RideExecutionReportStatus = 'Pending' | 'Approved' | 'Rejected' | 'Dispute';

export interface RideExecutionReportItem {
  rideId: string;
  rideDate: string;
  driverId: string;
  driverName: string;
  companyId?: string;
  companyName?: string;
  clientName?: string;
  status: RideExecutionReportStatus;
  weekNumber?: number;
  periodNumber?: number;
  decimalHours: number;
  totalCompensation: number;
  nightAllowance?: number;
  kilometerReimbursement?: number;
  consignmentFee?: number;
  taxFreeCompensation?: number;
  variousCompensation?: number;
  standOver?: number;
  saturdayHours?: number;
  sundayHolidayHours?: number;
  vacationHoursEarned?: number;
}

export interface RideExecutionReportTotals {
  decimalHours: number;
  totalCompensation: number;
  nightAllowance: number;
  kilometerReimbursement: number;
  consignmentFee: number;
  taxFreeCompensation: number;
  variousCompensation: number;
  standOver: number;
  saturdayHours: number;
  sundayHolidayHours: number;
  vacationHoursEarned: number;
}

export interface RideExecutionReportDriverSummary extends RideExecutionReportTotals {
  driverId: string;
  driverName: string;
  rideCount: number;
}

export interface RideExecutionReportResponse {
  startDate: string;
  endDate: string;
  driverId?: string;
  companyId?: string;
  statusFilter?: string;
  items: RideExecutionReportItem[];
  totals: RideExecutionReportTotals;
  driverSummaries: RideExecutionReportDriverSummary[];
}

export interface RideExecutionReportFilters {
  startDate: string;
  endDate: string;
  driverId?: string;
  companyId?: string;
  status?: RideExecutionReportStatus | 'all';
}

const fetchRideExecutionReport = async ({
  startDate,
  endDate,
  driverId,
  companyId,
  status,
}: RideExecutionReportFilters): Promise<RideExecutionReportResponse> => {
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required');
  }

  const getEmptyResponse = (): RideExecutionReportResponse => ({
    startDate,
    endDate,
    driverId,
    companyId,
    statusFilter: status && status !== 'all' ? status : undefined,
    items: [],
    totals: {
      decimalHours: 0,
      totalCompensation: 0,
      nightAllowance: 0,
      kilometerReimbursement: 0,
      consignmentFee: 0,
      taxFreeCompensation: 0,
      variousCompensation: 0,
      standOver: 0,
      saturdayHours: 0,
      sundayHolidayHours: 0,
      vacationHoursEarned: 0,
    },
    driverSummaries: [],
  });

  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (driverId) {
    params.set('driverId', driverId);
  }

  if (companyId) {
    params.set('companyId', companyId);
  }

  if (status && status !== 'all') {
    params.set('status', status);
  }

  try {
    const { data } = await api.get<ApiResponse<RideExecutionReportResponse>>(
      `/reports/ride-executions?${params.toString()}`
    );

    if (data.isSuccess && data.data) {
      return data.data;
    }

    throw new Error(data.errors?.[0] || 'Failed to fetch ride execution report');
  } catch (error: any) {
    const statusCode = error?.response?.status;
    if (statusCode === 404) {
      return getEmptyResponse();
    }
    throw error;
  }
};

export const useRideExecutionReport = (filters: RideExecutionReportFilters | null) =>
  useQuery({
    queryKey: ['rideExecutionReport', filters],
    queryFn: () => fetchRideExecutionReport(filters as RideExecutionReportFilters),
    enabled: Boolean(filters?.startDate && filters?.endDate),
  });


