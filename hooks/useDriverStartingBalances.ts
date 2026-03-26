import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { DriverStartingBalanceDto } from '@/types/startingBalance';

const fetchDriverStartingBalances = async (
    driverId: string,
    year?: number
): Promise<DriverStartingBalanceDto[]> => {
    const params = year ? `?year=${year}` : '';
    const response = await api.get<ApiResponse<DriverStartingBalanceDto[]>>(
        `/drivers/${driverId}/starting-balances${params}`
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch starting balances');
};

export const useDriverStartingBalances = (driverId: string, year?: number) => {
    return useQuery<DriverStartingBalanceDto[], Error>({
        queryKey: ['starting-balances', driverId, year],
        queryFn: () => fetchDriverStartingBalances(driverId, year),
        enabled: !!driverId,
    });
};
