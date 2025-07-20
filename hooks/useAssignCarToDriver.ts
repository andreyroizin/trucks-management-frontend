import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export interface AssignCarToDriverRequest {
    carId?: string | null;
    companyId?: string;
}

export interface DriverCarInfo {
    driverId: string;
    companyId: string;
    companyName: string;
    carId: string | null;
    carLicensePlate: string | null;
    carVehicleYear: number | null;
    carRegistrationDate: string | null;
}

// --- API CALL ---
const assignCarToDriver = async (
    userId: string, 
    data: AssignCarToDriverRequest
): Promise<DriverCarInfo> => {
    const response = await api.put<ApiResponse<DriverCarInfo>>(`/users/${userId}/driver`, data);
    
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to assign car to driver');
    }
    
    return response.data.data;
};

// --- HOOK ---
export const useAssignCarToDriver = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ userId, ...data }: AssignCarToDriverRequest & { userId: string }) =>
            assignCarToDriver(userId, data),
        onSuccess: () => {
            // Refresh relevant queries
            queryClient.invalidateQueries({ queryKey: ['car'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
        },
    });
}; 