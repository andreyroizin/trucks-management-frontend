import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- SIGN FUNCTION ---
async function signPublicContract(
    contractId: string,
    accessCode: string,
    signature: string,
    pdfFile?: Blob
): Promise<void> {
    const formData = new FormData();
    formData.append('contractId', contractId);
    formData.append('accessCode', accessCode);
    formData.append('signature', signature);

    if (pdfFile) {
        formData.append('file', pdfFile, 'signed-contract.pdf');
    }

    const res = await api.post<ApiResponse<null>>(
        '/employee-contracts/sign',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
        }
    );

    if (!res.data.isSuccess) {
        throw new Error(res.data.errors?.[0] || 'Failed to sign contract');
    }
}

// --- HOOK ---
export function useSignPublicContract() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         contractId,
                         accessCode,
                         signature,
                         pdfFile,
                     }: {
            contractId: string;
            accessCode: string;
            signature: string;
            pdfFile?: Blob;
        }) =>
            signPublicContract(contractId, accessCode, signature, pdfFile),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['publicContractDetail', variables.contractId, variables.accessCode],
            });
        },
    });
}
