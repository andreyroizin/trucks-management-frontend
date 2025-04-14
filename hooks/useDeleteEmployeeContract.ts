import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE FUNCTION ---
async function deleteEmployeeContract(id: string): Promise<void> {
    const res = await api.delete<ApiResponse<null>>(`/employee-contracts/${id}`);
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to delete employee contract');
    }
}

// --- HOOK ---
export function useDeleteEmployeeContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployeeContract,
        onSuccess: () => {
            // e.g. invalidate queries if needed
            queryClient.invalidateQueries({ queryKey: ['employeeContracts'] });
        },
    });
}
