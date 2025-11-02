import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type GenerateRideDay = {
    date: string; // YYYY-MM-DD format
    clients: {
        clientId: string;
        trucksToGenerate: number;
    }[];
};

export type GenerateRidesInput = {
    weekStartDate: string; // YYYY-MM-DD format (Monday)
    companyId?: string; // Optional - backend will filter by user's company if not provided
    days: GenerateRideDay[];
};

export type GenerateRidesResponse = {
    totalRidesCreated: number;
    ridesByDay: {
        date: string;
        rideIds: string[]; // Array of created ride GUIDs
    }[];
    summary: {
        [clientId: string]: {
            clientName: string;
            totalRides: number;
        };
    };
};

const generateRides = async (input: GenerateRidesInput): Promise<GenerateRidesResponse> => {
    console.log('API: Generating rides with input:', input);
    console.log('API: Request URL:', `${api.defaults.baseURL}/weekly-planning/generate`);

    try {
        const response = await api.post<ApiResponse<GenerateRidesResponse>>('/weekly-planning/generate', input);
        console.log('API: Generate rides response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to generate rides');
    } catch (error: any) {
        console.error('API: Generate rides failed:', error);
        console.error('API: Error message:', error.message);
        console.error('API: Error response status:', error.response?.status);
        console.error('API: Error response data:', error.response?.data);
        console.error('API: Request data:', input);
        
        // Re-throw with more context
        if (error.response?.data?.errors) {
            throw new Error(error.response.data.errors[0] || 'Backend error');
        } else if (error.response?.status) {
            throw new Error(`HTTP ${error.response.status}: ${error.response.statusText || 'Request failed'}`);
        } else if (error.message) {
            throw new Error(`Network error: ${error.message}`);
        } else {
            throw new Error('Unknown error occurred');
        }
    }
};

export const useGenerateRides = () => {
    const queryClient = useQueryClient();
    
    return useMutation<GenerateRidesResponse, Error, GenerateRidesInput>({
        mutationFn: generateRides,
        onSuccess: () => {
            // Invalidate weekly rides queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
            // Also invalidate daily rides queries in case user switches to daily view
            queryClient.invalidateQueries({ queryKey: ['daily-rides'] });
        },
    });
};
