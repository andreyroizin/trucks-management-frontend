import {useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/utils/api';
import {ApiResponse} from '@/types/api';

export type UpdateCarInput = {
    id: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    remark?: string;
    companyId: string;
    newUploads?: {
        fileId: string;
        originalFileName: string;
    }[];
    fileIdsToDelete?: string[];
};

// Update Car API
export const updateCar = async ({ id, ...carData }: UpdateCarInput) => {
    const response = await api.put<ApiResponse<null>>(`/cars/${id}`, carData);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to update car.');
    }
};

// Hook to update car
export const useEditCar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cars'] });
        },
    });
};
