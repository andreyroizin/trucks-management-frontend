// hooks/useArchivedDriverPeriods.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

/* ---------- types (local to this hook) ---------- */
export type ArchivedPeriod = {
    year: number;
    periodNr: number;
    status: number;          // 0-3 as per enum
    fromDate: string;        // ISO
    toDate: string;          // ISO
};

export type ArchivedPeriodPage = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    data: ArchivedPeriod[];
};
/* ------------------------------------------------ */

/** plain fetcher */
async function fetchArchivedDriverPeriods(
    pageNumber: number,
    pageSize: number
): Promise<ArchivedPeriodPage> {
    const res = await api.get<ApiResponse<ArchivedPeriodPage>>(
        `/drivers/periods/pending`,       // ⬅️  adjust if your endpoint differs
        { params: { pageNumber, pageSize } }
    );
    if (!res.data.isSuccess || !res.data.data)
        throw new Error(res.data.errors?.[0] || 'Failed to fetch archived periods');

    return res.data.data;
}

/** react-query hook */
export function usePendingDriverPeriods(pageNumber: number, pageSize: number) {
    return useQuery({
        queryKey: ['pendingPeriods', pageNumber, pageSize],
        queryFn: () => fetchArchivedDriverPeriods(pageNumber, pageSize),
        placeholderData: keepPreviousData => keepPreviousData,
        staleTime: 30 * 1_000,        // 30 s – tweak as you like
    });
}