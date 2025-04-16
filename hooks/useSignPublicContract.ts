import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- SIGN FUNCTION ---
async function signPublicContract(contractId: string, accessCode: string, signature: string): Promise<void> {
    const res = await api.post<ApiResponse<null>>('/employee-contracts/sign', {
        contractId,
        accessCode,
        signature,
    });
    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to sign contract');
    }
}

// --- HOOK ---
export function useSignPublicContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ contractId, accessCode, signature }: { contractId: string; accessCode: string; signature: string }) =>
            signPublicContract(contractId, accessCode, signature),
        onSuccess: (_data, variables) => {
            // Invalidate or refetch public contract detail so user sees updated status
            queryClient.invalidateQueries({ queryKey: ['publicContractDetail', variables.contractId, variables.accessCode] });
        },
    });
}
