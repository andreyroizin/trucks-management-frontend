import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const deleteEmployee = async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: deleteEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};
