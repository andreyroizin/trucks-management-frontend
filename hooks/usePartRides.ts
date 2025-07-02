import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import {PartRideStatus} from "@/utils/partRideStatus";

// --- TYPES ---
export type PartRide = {
    id: string;
    date: string;
    start: string;
    end: string;
    rest?: string;
    kilometers: number;
    costs: number;
    employer?: string;
    client?: {
        id: string;
        name: string;
    };
    company?: {
        id: string;
        name: string;
    };
    day: number;
    weekNumber: number;
    hours: number;
    decimalHours: number;
    costsDescription?: string;
    turnover: number;
    remark?: string;
    driver?: {
        id: string;
        aspNetUserId: string;
        firstName: string;
        lastName: string;
    };
    status: PartRideStatus;
    car?: {
        id: string;
        licensePlate: string;
    };
    earnings: number
};

export type PartRidesResponse = {
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: PartRide[];
};

// --- FETCH FUNCTION ---
const fetchPartRides = async ({
                                  companyId,
                                  clientIds,
                                  driverIds,
                                  carIds,
                                  statusIds,
                                  weekNumber,
                                  turnoverMin,
                                  turnoverMax,
                                  decimalHoursMin,
                                  decimalHoursMax,
                                  startDate,
                                  endDate,
                                  pageNumber,
                                  pageSize,
                              }: {
    companyId?: string;
    clientIds?: string[];
    driverIds?: string[];
    carIds?: string[];
    statusIds?: string[];
    weekNumber?: string;
    turnoverMin?: string;
    turnoverMax?: string;
    decimalHoursMin?: string;
    decimalHoursMax?: string;
    startDate?: string;
    endDate?: string;
    pageNumber: number;
    pageSize: number;
}): Promise<PartRidesResponse> => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.set('companyId', companyId);
    clientIds?.forEach(id => queryParams.append('clientIds', id));
    driverIds?.forEach(id => queryParams.append('driverIds', id));
    carIds?.forEach(id => queryParams.append('carIds', id));
    statusIds?.forEach(id => queryParams.append('statusIds', id));
    if (weekNumber) queryParams.set('weekNumber', weekNumber);
    if (turnoverMin) queryParams.set('turnoverMin', turnoverMin);
    if (turnoverMax) queryParams.set('turnoverMax', turnoverMax);
    if (decimalHoursMin) queryParams.set('decimalHoursMin', decimalHoursMin);
    if (decimalHoursMax) queryParams.set('decimalHoursMax', decimalHoursMax);
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    queryParams.set('pageNumber', pageNumber.toString());
    queryParams.set('pageSize', pageSize.toString());

    const response = await api.get<ApiResponse<PartRidesResponse>>(
        `/partrides?${queryParams.toString()}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch part rides');
};

// --- QUERY HOOK ---
export const usePartRides = ({
                                 companyId,
                                 clientIds,
                                 driverIds,
                                 carIds,
                                 statusIds,
                                 weekNumber,
                                 turnoverMin,
                                 turnoverMax,
                                 decimalHoursMin,
                                 decimalHoursMax,
                                 startDate,
                                 endDate,
                                 pageNumber,
                                 pageSize,
                             }: {
    companyId?: string;
    clientIds?: string[];
    driverIds?: string[];
    carIds?: string[];
    statusIds?: string[];
    weekNumber?: string;
    turnoverMin?: string;
    turnoverMax?: string;
    decimalHoursMin?: string;
    decimalHoursMax?: string;
    startDate?: string;
    endDate?: string;
    pageNumber: number;
    pageSize: number;
}) => {
    return useQuery({
        queryKey: [
            'partRides',
            companyId,
            clientIds,
            driverIds,
            carIds,
            statusIds,
            weekNumber,
            turnoverMin,
            turnoverMax,
            decimalHoursMin,
            decimalHoursMax,
            startDate,
            endDate,
            pageNumber,
            pageSize,
        ],
        queryFn: () =>
            fetchPartRides({
                companyId,
                clientIds,
                driverIds,
                carIds,
                statusIds,
                weekNumber,
                turnoverMin,
                turnoverMax,
                decimalHoursMin,
                decimalHoursMax,
                startDate,
                endDate,
                pageNumber,
                pageSize,
            }),
        placeholderData: (prev) => prev, // keepPreviousData
    });
};
