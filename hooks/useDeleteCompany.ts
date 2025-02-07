import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
type DeleteCompanyResponse = string; // e.g., "Company deleted successfully."

// --- FETCH FUNCTION ---
const deleteCompany = async (id: string): Promise<ApiResponse<DeleteCompanyResponse>> => {
    const response = await api.delete<ApiResponse<DeleteCompanyResponse>>(`/companies/${id}`);
    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete company');
};

// --- CUSTOM HOOK ---
export const useDeleteCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) => deleteCompany(companyId),
        onSuccess: () => {
            // Invalidate or refetch data
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
};
