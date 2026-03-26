import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { saveAs } from 'file-saver';

const downloadQuotePdf = async ({
    id,
    fileName,
}: {
    id: string;
    fileName?: string;
}) => {
    const response = await api.get(`/quotes/${id}/pdf`, {
        responseType: 'blob',
    });
    const blob = response.data;
    saveAs(blob, fileName || `offerte_${id}.pdf`);
};

export const useDownloadQuotePdf = () => {
    return useMutation({
        mutationFn: downloadQuotePdf,
        onError: (error: any) => {
            console.error('Failed to download quote PDF:', error);
        },
    });
};
