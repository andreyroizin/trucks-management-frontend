import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

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
    };
    carId?: string;
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
                                  clientId,
                                  driverIds,
                                  carId,
                                  weekNumber,
                                  turnoverMin,
                                  turnoverMax,
                                  decimalHoursMin,
                                  decimalHoursMax,
                                  pageNumber,
                                  pageSize,
                              }: {
    companyId?: string;
    clientId?: string;
    driverIds?: string[];
    carId?: string;
    weekNumber?: string;
    turnoverMin?: string;
    turnoverMax?: string;
    decimalHoursMin?: string;
    decimalHoursMax?: string;
    pageNumber: number;
    pageSize: number;
}): Promise<PartRidesResponse> => {
    const queryParams = new URLSearchParams();
    if (companyId) queryParams.set('companyId', companyId);
    if (clientId) queryParams.set('clientId', clientId);
    if (driverIds && driverIds.length > 0) {
        driverIds.forEach(id => queryParams.append('driverIds', id));
    }
    if (carId) queryParams.set('carId', carId);
    if (weekNumber) queryParams.set('weekNumber', weekNumber);
    if (turnoverMin) queryParams.set('turnoverMin', turnoverMin);
    if (turnoverMax) queryParams.set('turnoverMax', turnoverMax);
    if (decimalHoursMin) queryParams.set('decimalHoursMin', decimalHoursMin);
    if (decimalHoursMax) queryParams.set('decimalHoursMax', decimalHoursMax);

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
                                 clientId,
                                 driverIds,
                                 carId,
                                 weekNumber,
                                 turnoverMin,
                                 turnoverMax,
                                 decimalHoursMin,
                                 decimalHoursMax,
                                 pageNumber,
                                 pageSize,
                             }: {
    companyId?: string;
    clientId?: string;
    driverIds?: string[];
    carId?: string;
    weekNumber?: string;
    turnoverMin?: string;
    turnoverMax?: string;
    decimalHoursMin?: string;
    decimalHoursMax?: string;
    pageNumber: number;
    pageSize: number;
}) => {
    return useQuery({
        queryKey: [
            'partRides',
            companyId,
            clientId,
            driverIds,
            carId,
            weekNumber,
            turnoverMin,
            turnoverMax,
            decimalHoursMin,
            decimalHoursMax,
            pageNumber,
            pageSize,
        ],
        queryFn: () =>
            fetchPartRides({
                companyId,
                clientId,
                driverIds,
                carId,
                weekNumber,
                turnoverMin,
                turnoverMax,
                decimalHoursMin,
                decimalHoursMax,
                pageNumber,
                pageSize,
            }),
        placeholderData: (prev) => prev, // keepPreviousData
    });
};
