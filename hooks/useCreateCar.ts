import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CarInput = {
    companyId: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    leasingStartDate?: string;
    leasingEndDate?: string;
    remark?: string;
    newUploads?: {
        fileId: string;
        originalFileName: string;
    }[];
};

export type CarResponse = {
    id: string;
    companyId: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    remark?: string;
};

// --- API CALL ---
const createCar = async (car: CarInput): Promise<CarResponse> => {
    const response = await api.post<ApiResponse<CarResponse>>('/cars', car);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create car');
};

// --- MUTATION HOOK ---
export const useCreateCar = () => {
    const queryClient = useQueryClient();
    return useMutation<CarResponse, Error, CarInput>({
        mutationFn: createCar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cars'] });
        },
    });
};
