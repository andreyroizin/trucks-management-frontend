import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type DownloadContractResponse = {
    id: string;
    employeeFirstName: string;
    employeeLastName: string;
    status: number;
    fileName: string;
    contentBase64: string;
};

async function fetchSignedPdf(id: string, access: string) {
    const res = await api.get<ApiResponse<DownloadContractResponse>>(
        `/employee-contracts/${id}/download?access=${encodeURIComponent(access)}`
    );

    if (!res.data.isSuccess || !res.data.data) {
        throw new Error(res.data.errors?.[0] || 'Download failed');
    }
    return res.data.data;
}

export function useDownloadContract() {
    return useMutation({
        mutationFn: ({ id, access }: { id: string; access: string }) =>
            fetchSignedPdf(id, access),
    });
}
