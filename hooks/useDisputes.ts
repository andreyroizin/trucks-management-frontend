import {useQuery} from '@tanstack/react-query';
import {ApiResponse} from '@/types/api';
import {api} from "@/utils/api";

/* ─────────────────── Types ─────────────────── */
export type Dispute = {
    id: string;
    status: number;            // 0‑Dispute · 1‑Approved · 2‑Rejected · 4‑Approved
    correctionHours: number;
    createdAtUtc: string;
    driver: {
        id: string;
        firstName: string;
        lastName: string;
    };
    company: {
        id: string;
        name: string;
    };
    partRide: {
        id: string;
        date: string;
        decimalHours: number;
    };
};

export type DisputesResponse = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    data: Dispute[];
};

/* ───────────────── Fetcher ─────────────────── */
const fetchDisputes = async ({
                                 driverId,
                                 companyIds,
                                 dateFrom,
                                 dateTo,
                                 pageNumber,
                                 pageSize,
                             }: {
    driverId?: string;
    companyIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    pageNumber: number;
    pageSize: number;
}): Promise<DisputesResponse> => {
    const qp = new URLSearchParams();

    if (driverId) qp.set('driverId', driverId);
    companyIds?.forEach((id) => qp.append('companyIds', id));
    if (dateFrom) qp.set('dateFrom', dateFrom);
    if (dateTo) qp.set('dateTo', dateTo);
    qp.set('pageNumber', pageNumber.toString());
    qp.set('pageSize', pageSize.toString());

    const {data} = await api.get<ApiResponse<DisputesResponse>>(
        `/disputes?${qp.toString()}`);

    if (!data.isSuccess) {
        throw new Error(data.errors?.[0] || 'Failed to fetch disputes');
    }
    return data.data;
};

/* ───────────────── Hook ─────────────────────── */
export const useDisputes = ({
                                driverId,
                                companyIds,
                                dateFrom,
                                dateTo,
                                pageNumber,
                                pageSize,
                            }: {
    driverId?: string;
    companyIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    pageNumber: number;
    pageSize: number;
}) =>
    useQuery({
        queryKey: [
            'disputes',
            driverId,
            companyIds,
            dateFrom,
            dateTo,
            pageNumber,
            pageSize,
        ],
        queryFn: () =>
            fetchDisputes({
                driverId,
                companyIds,
                dateFrom,
                dateTo,
                pageNumber,
                pageSize,
            }),
        placeholderData: (prev) => prev,
    });

