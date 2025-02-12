import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE CAR FUNCTION ---
const deleteCar = async (id: string): Promise<ApiResponse<string>> => {
    const response = await api.delete<ApiResponse<string>>(`/cars/${id}`);

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete car');
};

// --- HOOK TO DELETE A CAR ---
export const useDeleteCar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cars'] });
        },
    });
};
