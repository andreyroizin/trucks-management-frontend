import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';

// Backend now uses numeric status codes: 2 = Signed
export type WeekApprovalStatus = 0 | 1 | 2 | 3; // PendingAdmin | PendingDriver | Signed | Invalidated

export type WeekDetail = {
    id: string;
    year: number;
    weekNr: number;
    periodNr: number;
    status: WeekApprovalStatus;
    driverSignedAt?: string;
    adminAllowedAt?: string;
    totalCompensation: number;
};

const fetchWeekStatus = async (year: number, weekNumber: number, driverId?: string): Promise<WeekDetail> => {
    // Build query parameters
    const params = new URLSearchParams({
        year: year.toString(),
        weekNumber: weekNumber.toString()
    });
    
    // Add driverId for admin roles (backend will ignore for driver role)
    if (driverId) {
        params.append('driverId', driverId);
    }
    
    const url = `/drivers/week/details?${params.toString()}`;
    
    const response = await api.get<ApiResponse<WeekDetail>>(url);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch week status');
};

export const useWeekStatus = (year: number, weekNumber: number, driverId?: string) => {
    const { user } = useAuth();
    
    // Determine if we need to pass driverId (for admin roles)
    const isAdmin = user?.roles?.includes('globalAdmin') || user?.roles?.includes('customerAdmin');
    const finalDriverId = isAdmin && driverId ? driverId : undefined;
    
    return useQuery<WeekDetail, Error>({
        queryKey: ['weekStatus', year, weekNumber, finalDriverId],
        queryFn: () => fetchWeekStatus(year, weekNumber, finalDriverId),
        enabled: !!year && !!weekNumber,
        retry: false, // Don't retry if week doesn't exist
    });
}; 