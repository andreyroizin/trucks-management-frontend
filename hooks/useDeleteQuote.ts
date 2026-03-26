import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

const deleteQuote = async (id: string): Promise<void> => {
    await api.delete(`/quotes/${id}`);
};

export const useDeleteQuote = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: deleteQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
    });
};
