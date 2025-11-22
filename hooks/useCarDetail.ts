import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CarDetail = {
    id: string;
    licensePlate: string;
    remark: string;
    vehicleYear?: string;
    registrationDate?: string;
    leasingStartDate?: string;
    leasingEndDate?: string;
    company: {
        id: string;
        name: string;
    };
    driverId?: string | null;
    driverFirstName?: string | null;
    driverLastName?: string | null;
    driverEmail?: string | null;
    files?: {
        id: string;
        originalFileName?: string;
        contentType?: string;
    }[];
};

// --- API CALL ---
const fetchCarDetail = async (id: string): Promise<CarDetail> => {
    const response = await api.get<ApiResponse<CarDetail>>(`/cars/${id}`);

    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch car details');
};

// --- HOOK ---
export const useCarDetail = (id: string) => {
    return useQuery({
        queryKey: ['carDetail', id],
        queryFn: () => fetchCarDetail(id),
    });
};
