import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { PendingDepartureDto } from '@/types/annualStatement';

const fetchPendingDepartures = async (): Promise<PendingDepartureDto[]> => {
    const response = await api.get<ApiResponse<PendingDepartureDto[]>>(
        '/annual-statements/pending-departures'
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch pending departures');
};

export const usePendingDepartures = () => {
    return useQuery<PendingDepartureDto[], Error>({
        queryKey: ['annual-statements-pending-departures'],
        queryFn: fetchPendingDepartures,
    });
};
