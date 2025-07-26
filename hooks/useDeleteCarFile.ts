import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE CAR FILE FUNCTION ---
const deleteCarFile = async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<null>>(`/car-files/${id}`);

    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to delete car file');
    }
};

// --- HOOK TO DELETE A CAR FILE ---
export const useDeleteCarFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCarFile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['car'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
        },
    });
}; 