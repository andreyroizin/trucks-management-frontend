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
    car: {
        id: string;
        licensePlate: string;
    },
    client: {
        id: string;
        name: string;
    }
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
                                 driverIds,
                                 companyIds,
                                 clientIds,
                                 carIds,
                                 statuses,
                                 date,
                                 dateFrom,
                                 dateTo,
                                 pageNumber,
                                 pageSize,
                             }: {
    driverIds?: string[];
    companyIds?: string[];
    clientIds?: string[];
    carIds?: string[];
    statuses?: string[];
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    pageNumber: number;
    pageSize: number;
}): Promise<DisputesResponse> => {
    const qp = new URLSearchParams();

    driverIds?.forEach(id => qp.append('driverIds', id));
    companyIds?.forEach(id => qp.append('companyIds', id));
    clientIds?.forEach(id => qp.append('clientIds', id));
    carIds?.forEach(id => qp.append('carIds', id));
    statuses?.forEach(s => qp.append('statuses', s));

    if (date) qp.set('date', date);
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
                                driverIds,
                                companyIds,
                                clientIds,
                                carIds,
                                statuses,
                                date,
                                dateFrom,
                                dateTo,
                                pageNumber,
                                pageSize,
                            }: {
    driverIds?: string[];
    companyIds?: string[];
    clientIds?: string[];
    carIds?: string[];
    statuses?: string[];
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    pageNumber: number;
    pageSize: number;
}) =>
    useQuery({
        queryKey: [
            'disputes',
            driverIds,
            companyIds,
            clientIds,
            carIds,
            statuses,
            date,
            dateFrom,
            dateTo,
            pageNumber,
            pageSize,
        ],
        queryFn: () =>
            fetchDisputes({
                driverIds,
                companyIds,
                clientIds,
                carIds,
                statuses,
                date,
                dateFrom,
                dateTo,
                pageNumber,
                pageSize,
            }),
        placeholderData: (prev) => prev,
    });
