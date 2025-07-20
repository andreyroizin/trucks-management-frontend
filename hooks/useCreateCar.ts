import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CarInput = {
    companyId: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    remark?: string;
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
    console.log('Creating car with data:', car);
    const response = await api.post<ApiResponse<CarResponse>>('/cars', car);
    console.log('Car create response:', response.data);
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
