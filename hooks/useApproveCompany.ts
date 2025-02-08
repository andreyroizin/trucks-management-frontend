import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- API CALL ---
const approveCompany = async (companyId: string): Promise<void> => {
    const response = await api.put<ApiResponse<null>>(`/companies/${companyId}/approve`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to approve company.');
    }
};

// --- MUTATION HOOK ---
export const useApproveCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) => approveCompany(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingCompanies'] });
            queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
};
