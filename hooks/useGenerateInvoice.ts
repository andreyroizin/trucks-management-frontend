'use client';

import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import axios from 'axios';

export interface GenerateInvoiceRequest {
    year: number;
    weekNumber: number;
    hoursWorked: number;
    hourlyCompensation: number;
    additionalCompensation: number;
}

export const useGenerateInvoice = () => {
    return useMutation<Blob, Error, { driverId: string; request: GenerateInvoiceRequest }>({
        mutationFn: async ({ driverId, request }) => {
            console.log('📤 [useGenerateInvoice] Sending invoice generation request');
            console.log('  Driver ID:', driverId);
            console.log('  Week Number:', request.weekNumber);
            console.log('  Request Payload:', {
                year: request.year,
                weekNumber: request.weekNumber,
                hoursWorked: request.hoursWorked,
                hourlyCompensation: request.hourlyCompensation,
                additionalCompensation: request.additionalCompensation,
            });
            console.log('  Full URL:', `${api.defaults.baseURL}/drivers/${driverId}/weeks/${request.weekNumber}/invoice`);

            try {
                const response = await api.post(
                    `/drivers/${driverId}/weeks/${request.weekNumber}/invoice`,
                    request,
                    {
                        responseType: 'blob', // Important for PDF download
                    }
                );
                
                console.log('✅ [useGenerateInvoice] Invoice generated successfully');
                console.log('  Response size:', response.data.size, 'bytes');
                console.log('  Content-Type:', response.headers['content-type']);
                
                return response.data;
            } catch (error) {
                console.error('❌ [useGenerateInvoice] Error generating invoice');
                
                if (axios.isAxiosError(error)) {
                    console.error('  Status:', error.response?.status);
                    console.error('  Status Text:', error.response?.statusText);
                    console.error('  Request URL:', error.config?.url);
                    console.error('  Request Method:', error.config?.method?.toUpperCase());
                    console.error('  Request Data:', error.config?.data);
                    
                    // Try to extract error message from blob response
                    if (error.response?.data instanceof Blob) {
                        console.error('  Response is Blob, extracting text...');
                        const text = await error.response.data.text();
                        console.error('  Blob Text:', text);
                        
                        try {
                            const json = JSON.parse(text);
                            console.error('  Parsed JSON Error:', json);
                            const errorMessage = json.errors?.[0] || json.message || 'Failed to generate invoice';
                            console.error('  Extracted Error Message:', errorMessage);
                            throw new Error(errorMessage);
                        } catch (parseError) {
                            console.error('  Failed to parse blob as JSON:', parseError);
                            console.error('  Raw text:', text);
                            throw new Error('Failed to generate invoice: ' + text);
                        }
                    } else if (error.response?.data) {
                        console.error('  Response Data:', error.response.data);
                        const errorMessage = error.response.data.errors?.[0] || error.response.data.message || error.message;
                        console.error('  Extracted Error Message:', errorMessage);
                        throw new Error(errorMessage);
                    }
                    
                    throw new Error(error.message || 'Failed to generate invoice');
                } else {
                    console.error('  Non-Axios Error:', error);
                }
                
                throw error instanceof Error ? error : new Error('Failed to generate invoice');
            }
        },
    });
};

