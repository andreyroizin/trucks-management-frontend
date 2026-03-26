import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { saveAs } from 'file-saver';

const downloadAnnualStatement = async ({
    id,
    fileName,
}: {
    id: string;
    fileName?: string;
}) => {
    const response = await api.get(`/annual-statements/${id}/download`, {
        responseType: 'blob',
    });
    const blob = response.data;
    saveAs(blob, fileName || `jaaropgave_${id}.pdf`);
};

export const useDownloadAnnualStatement = () => {
    return useMutation({
        mutationFn: downloadAnnualStatement,
        onError: (error: any) => {
            console.error('Failed to download annual statement:', error);
        },
    });
};
