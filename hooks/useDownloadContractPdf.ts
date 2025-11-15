import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { api } from '@/utils/api';
import { DownloadContractPdfParams } from '@/types/driverContract';
import axios from 'axios';

/**
 * Hook to download a contract PDF
 * Returns a mutation that can be called with driverId, versionId, and optional fileName
 */
export const useDownloadContractPdf = () => {
    return useMutation<void, Error, DownloadContractPdfParams>({
        mutationFn: async ({ driverId, versionId, fileName }) => {
            try {
                const response = await api.get<Blob>(
                    `/drivers/${driverId}/contracts/${versionId}/download`,
                    {
                        responseType: 'blob',
                    }
                );

                // Extract filename from Content-Disposition header or use provided/default
                let downloadFileName = fileName || `contract_${driverId}_${versionId}.pdf`;

                const contentDisposition = response.headers['content-disposition'];
                if (!fileName && contentDisposition) {
                    const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (match && match[1]) {
                        // Remove quotes if present
                        downloadFileName = match[1].replace(/['"]/g, '');
                    }
                }

                // Create blob and download
                const blob = new Blob([response.data], { type: 'application/pdf' });
                saveAs(blob, downloadFileName);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(
                        '[useDownloadContractPdf] Axios error while downloading contract',
                        {
                            status: error.response?.status,
                            data: error.response?.data,
                            message: error.message,
                        }
                    );
                    
                    // Create a more descriptive error based on status code
                    let errorMessage = 'Failed to download contract. Please try again.';
                    
                    if (error.response?.status === 404) {
                        errorMessage = 'Contract PDF file not found. Please regenerate the contract.';
                    } else if (error.response?.status === 403) {
                        errorMessage = 'You do not have permission to download this contract.';
                    } else if (error.response?.status === 500) {
                        errorMessage = 'Server error while downloading contract. Please try again later.';
                    } else {
                        // Try to extract error message from response
                        const responseError = error.response?.data?.errors?.[0] || 
                                            error.response?.data?.message || 
                                            error.message;
                        if (responseError) {
                            errorMessage = responseError;
                        }
                    }
                    
                    throw new Error(errorMessage);
                } else {
                    console.error('[useDownloadContractPdf] Unexpected error while downloading contract', error);
                    throw error instanceof Error ? error : new Error('Failed to download contract. Please try again.');
                }
            }
        },
    });
};

