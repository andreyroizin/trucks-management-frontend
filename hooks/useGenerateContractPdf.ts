'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type GenerateContractPdfResponse = {
    fileName: string;
    contentBase64: string;
};

async function generateContractPdf(id: string): Promise<GenerateContractPdfResponse> {
    const res = await api.get<ApiResponse<GenerateContractPdfResponse>>(
        `/employee-contracts/${id}/generate-pdf`
    );
    if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.errors?.[0] || 'Failed to generate contract PDF');
    }
    return res.data.data;
}

export function useGenerateContractPdf() {
    return useMutation({
        mutationFn: (id: string) => generateContractPdf(id),
    });
}
