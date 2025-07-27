import { saveAs } from 'file-saver';
import { api } from '@/utils/api';

export const useDownloadDriverFile = () => {
    const downloadFile = async ({
        id,
        originalFileName,
        contentType
    }: {
        id: string;
        originalFileName?: string;
        contentType?: string;
    }) => {
        const response = await api.get<Blob>(`/driver-files/${id}`, {
            responseType: 'blob'
        });

        let filename = originalFileName || 'download.pdf';

        const contentDisposition = response.headers['content-disposition'];
        if (!originalFileName && contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match?.[1]) {
                filename = match[1];
            }
        }

        const blob = contentType
            ? new Blob([response.data], { type: contentType })
            : response.data;

        saveAs(blob, filename);
    };

    return downloadFile;
}; 