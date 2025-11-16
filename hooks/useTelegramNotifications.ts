import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import axios from 'axios';

// Types for Telegram registration
export interface TelegramRegistrationLinkResponse {
    driverId: string;
    driverName: string;
    registrationUrl: string;
    expiresAt: string;
    instructions: string;
    alreadyRegistered: boolean;
}

// Hook to generate Telegram registration link
export const useGenerateTelegramLink = () => {
    const queryClient = useQueryClient();

    return useMutation<TelegramRegistrationLinkResponse, Error, string>({
        mutationFn: async (driverId: string) => {
            try {
                const response = await api.get<ApiResponse<TelegramRegistrationLinkResponse>>(
                    `/drivers/${driverId}/telegram/registration-link`
                );
                
                if (!response.data.isSuccess) {
                    throw new Error(response.data.errors?.[0] || 'Failed to generate registration link');
                }
                
                return response.data.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorMessage = 
                        error.response?.data?.errors?.[0] ||
                        error.response?.data?.message ||
                        error.message ||
                        'Failed to generate registration link';
                    throw new Error(errorMessage);
                }
                throw error instanceof Error ? error : new Error('Failed to generate registration link');
            }
        },
        onSuccess: (data, driverId) => {
            // Invalidate driver data to refresh Telegram status
            queryClient.invalidateQueries({ queryKey: ['driverWithContract', driverId] });
        },
    });
};

// Hook to disable Telegram notifications
export const useDisableTelegramNotifications = () => {
    const queryClient = useQueryClient();

    return useMutation<string, Error, string>({
        mutationFn: async (driverId: string) => {
            try {
                const response = await api.delete<ApiResponse<string>>(
                    `/drivers/${driverId}/telegram`
                );
                
                if (!response.data.isSuccess) {
                    throw new Error(response.data.errors?.[0] || 'Failed to disable notifications');
                }
                
                return response.data.data;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const errorMessage = 
                        error.response?.data?.errors?.[0] ||
                        error.response?.data?.message ||
                        error.message ||
                        'Failed to disable notifications';
                    throw new Error(errorMessage);
                }
                throw error instanceof Error ? error : new Error('Failed to disable notifications');
            }
        },
        onSuccess: (data, driverId) => {
            // Invalidate driver data to refresh Telegram status
            queryClient.invalidateQueries({ queryKey: ['driverWithContract', driverId] });
        },
    });
};

