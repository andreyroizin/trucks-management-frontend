import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type SignedPeriod = {
    year: number;
    periodNr: number;
    status: string;
    fromDate: string;
    toDate: string;
};

export type SignedPeriodsData = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    data: SignedPeriod[];
};

const fetchSignedPeriods = async (): Promise<SignedPeriod[]> => {
    console.log(`🔍 usePeriodStatus - Fetching signed periods`);
    
    try {
        const response = await api.get<ApiResponse<SignedPeriodsData>>('/drivers/signed-periods?pageSize=100');
        console.log(`✅ usePeriodStatus - API Response:`, {
            status: response.status,
            isSuccess: response.data.isSuccess,
            periodsCount: response.data.data?.data?.length || 0,
            periods: response.data.data?.data
        });
        
        if (response.data.isSuccess) {
            return response.data.data.data;
        }
        throw new Error(response.data.errors?.[0] || 'Failed to fetch signed periods');
    } catch (error: any) {
        console.error(`❌ usePeriodStatus - API Error:`, {
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        throw error;
    }
};

export const useSignedPeriods = () => {
    return useQuery<SignedPeriod[], Error>({
        queryKey: ['signedPeriods'],
        queryFn: fetchSignedPeriods,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

// Helper function to check if a specific period is signed
export const usePeriodStatus = (year: number, periodNumber: number) => {
    const { data: signedPeriods, isLoading, error } = useSignedPeriods();
    
    console.log(`🔍 usePeriodStatus - Checking period status:`, {
        year,
        periodNumber,
        hasSignedPeriods: !!signedPeriods,
        signedPeriodsCount: signedPeriods?.length || 0,
        signedPeriods
    });
    
    // Backend uses numeric status: 2 = Signed, but signed periods endpoint returns string "Signed"
    const isPeriodSigned = signedPeriods?.some(period => 
        period.year === year && 
        period.periodNr === periodNumber && 
        (period.status === 'Signed' || period.status === '2')
    ) || false;

    console.log(`📊 usePeriodStatus - Result:`, {
        isPeriodSigned,
        isLoading,
        error: error?.message
    });

    return {
        isPeriodSigned,
        isLoading,
        error
    };
}; 