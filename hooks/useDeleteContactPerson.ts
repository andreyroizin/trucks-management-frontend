import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type DeleteContactPersonResponse = string; // Expected response: "Contact person deleted successfully."

// --- API CALL ---
const deleteContactPersonRequest = async (id: string): Promise<DeleteContactPersonResponse> => {
    const response = await api.delete<ApiResponse<DeleteContactPersonResponse>>(`/contactpersons/${id}`);

    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete contact person.');
};

// --- MUTATION HOOK ---
export const useDeleteContactPerson = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteContactPersonRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contactPersons'] }); // Refresh contact persons list
        },
    });
};
