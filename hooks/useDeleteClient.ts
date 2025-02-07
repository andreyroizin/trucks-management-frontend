import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
type DeleteClientResponse = string; // e.g. "Client deleted successfully."

// --- FETCH FUNCTION ---
const deleteClient = async (clientId: string): Promise<ApiResponse<DeleteClientResponse>> => {
    const response = await api.delete<ApiResponse<DeleteClientResponse>>(`/clients/${clientId}`);
    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete client');
};

// --- CUSTOM HOOK ---
export const useDeleteClient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteClient(id),
        onSuccess: () => {
            // Invalidate the clients list or any relevant queries
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
};
