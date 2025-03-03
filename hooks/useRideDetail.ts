import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type PartRide = {
    id: string;
    date: string;        // e.g., '2025-02-27T00:00:00Z'
    start: string;       // e.g., '17:00:00'
    end: string;         // e.g., '23:30:00'
    rest: string;        // e.g., '00:45:00'
    kilometers: number;
    costs: number;
    employer: string;
    day: number;
    weekNumber: number;
    hours: number;
    decimalHours: number;
    costsDescription: string;
    turnover: number;
    remark?: string;
    car: {
        id: string;
        licensePlate: string;
    } | null;
    driver: any; // or better typed if known
    client: {
        id: string;
        name: string;
    } | null;
};

export type RideDetail = {
    id: string;
    name: string;
    remark?: string;
    companyId: string;
    companyName: string;
    partRides: PartRide[];
};

// --- FETCH FUNCTION ---
const fetchRideDetail = async (id: string): Promise<RideDetail> => {
    const response = await api.get<ApiResponse<RideDetail>>(`/rides/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to load ride detail');
};

// --- HOOK ---
export const useRideDetail = (id: string) => {
    return useQuery({
        queryKey: ['rideDetail', id],
        queryFn: () => fetchRideDetail(id),
    });
};
