import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type WeekToSubmit = {
    id: string;
    year: number;
    weekNr: number;
    periodNr: number;
    status: number;                // raw status from backend
    driver: {
        driverId: string;
        firstName: string;
        lastName: string;
    };
    summaryStatus: 'Has Pending' | 'Has Disputes' | 'All Approved' | 'Has Rejected';
    partRideCount: number;
    totalHours: number;
    pendingAdminCount: number;
    disputeCount: number;
    rejectedCount: number;
    forecastedEarning: number;
};

export type WeeksToSubmitResponse = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    data: WeekToSubmit[];
};

/* ------------------------------------------------------------------ */
/* Fetcher                                                             */
/* ------------------------------------------------------------------ */

const fetchWeeksToSubmit = async ({
                                      driverId,
                                      weekNr,
                                      status,
                                      pageNumber,
                                      pageSize,
                                  }: {
    driverId?: string;
    weekNr?: number;
    status?: 'hasDisputes' | 'allApproved' | 'hasPending' | 'hasRejected';
    pageNumber: number;
    pageSize: number;
}): Promise<WeeksToSubmitResponse> => {
    const params = new URLSearchParams();
    if (driverId) params.set('driverId', driverId);
    if (weekNr !== undefined) params.set('weekNr', String(weekNr));
    if (status) params.set('status', status);
    params.set('pageNumber', String(pageNumber));
    params.set('pageSize', String(pageSize));

    const res = await api.get<ApiResponse<WeeksToSubmitResponse>>(
        `/weeks-to-submit?${params.toString()}`,
    );

    if (res.data.isSuccess) return res.data.data;
    throw new Error(res.data.errors?.[0] || 'Failed to fetch weeks to submit');
};

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export const useWeeksToSubmit = ({
                                     driverId,
                                     weekNr,
                                     status,
                                     pageNumber = 1,
                                     pageSize = 10,
                                 }: {
    driverId?: string;
    weekNr?: number;
    status?: 'hasDisputes' | 'allApproved' | 'hasPending' | 'hasRejected';
    pageNumber?: number;
    pageSize?: number;
}) =>
    useQuery({
        queryKey: [
            'weeksToSubmit',
            driverId,
            weekNr,
            status,
            pageNumber,
            pageSize,
        ],
        queryFn: () =>
            fetchWeeksToSubmit({
                driverId,
                weekNr,
                status,
                pageNumber,
                pageSize,
            }),
        placeholderData: (prev) => prev, // keep previous page while fetching next
    });