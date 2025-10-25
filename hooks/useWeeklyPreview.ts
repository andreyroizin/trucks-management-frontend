import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type WeeklyPreviewClient = {
    clientId: string;
    clientName: string;
    trucksNeeded: number;
    sourceTemplates: string[];
};

export type WeeklyPreviewDay = {
    date: string;
    dayName: string;
    clients: WeeklyPreviewClient[];
};

export type WeeklyPreviewData = {
    weekStartDate: string;
    days: WeeklyPreviewDay[];
};

const fetchWeeklyPreview = async (weekStartDate: string, companyId?: string): Promise<WeeklyPreviewData> => {
    console.log('API: Fetching weekly preview for week starting:', weekStartDate);
    console.log('API: Company ID:', companyId);
    console.log('API: Base URL:', api.defaults.baseURL);

    const params: any = {
        weekStartDate: weekStartDate,
    };
    
    if (companyId) {
        params.companyId = companyId;
    }

    console.log('API: Request params:', params);
    console.log('API: Full URL will be:', `${api.defaults.baseURL}/weekly-planning/preview`);

    try {
        const response = await api.get<ApiResponse<WeeklyPreviewData>>('/weekly-planning/preview', { params });
        console.log('API: Weekly preview response:', response.data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch weekly preview');
    } catch (error: any) {
        console.error('API: Weekly preview failed:', error);
        console.error('API: Error message:', error.message);
        console.error('API: Error response status:', error.response?.status);
        console.error('API: Error response data:', error.response?.data);
        console.error('API: Request URL:', error.config?.url);
        console.error('API: Request params:', error.config?.params);
        console.error('API: Full error object:', error);
        
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

export const useWeeklyPreview = (weekStartDate: string, companyId?: string) => {
    return useQuery<WeeklyPreviewData, Error>({
        queryKey: ['weekly-preview', weekStartDate, companyId],
        queryFn: () => fetchWeeklyPreview(weekStartDate, companyId),
        enabled: !!weekStartDate, // Only run query if weekStartDate is provided
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    });
};
