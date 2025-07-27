import { useWeekStatus, WeekDetail } from './useWeekStatus';

// Check if a period is fully signed by checking all 4 individual weeks
export const usePeriodStatusByWeeks = (year: number, periodNumber: number, driverId: string) => {
    // Don't make API calls if no driver selected
    const shouldFetch = !!driverId && !!year && !!periodNumber;
    
    // Calculate the 4 weeks in this period
    const baseWeek = (periodNumber - 1) * 4 + 1;
    const weeks = [baseWeek, baseWeek + 1, baseWeek + 2, baseWeek + 3];
    
    // Check status of all 4 weeks (only if we should fetch)
    const week1Status = useWeekStatus(shouldFetch ? year : 0, shouldFetch ? weeks[0] : 0, shouldFetch ? driverId : undefined);
    const week2Status = useWeekStatus(shouldFetch ? year : 0, shouldFetch ? weeks[1] : 0, shouldFetch ? driverId : undefined);
    const week3Status = useWeekStatus(shouldFetch ? year : 0, shouldFetch ? weeks[2] : 0, shouldFetch ? driverId : undefined);
    const week4Status = useWeekStatus(shouldFetch ? year : 0, shouldFetch ? weeks[3] : 0, shouldFetch ? driverId : undefined);
    
    // Determine if period is fully signed
    const isLoading = shouldFetch && (week1Status.isLoading || week2Status.isLoading || 
                     week3Status.isLoading || week4Status.isLoading);
    
    const allWeeksSigned = shouldFetch && (week1Status.data?.status === 2 && 
                          week2Status.data?.status === 2 && 
                          week3Status.data?.status === 2 && 
                          week4Status.data?.status === 2);
    
    console.log(`🔍 usePeriodStatusByWeeks - Checking period ${periodNumber} for driver ${driverId}:`, {
        year,
        periodNumber,
        driverId,
        shouldFetch,
        weeks,
        weekStatuses: shouldFetch ? {
            week1: { status: week1Status.data?.status, loading: week1Status.isLoading },
            week2: { status: week2Status.data?.status, loading: week2Status.isLoading },
            week3: { status: week3Status.data?.status, loading: week3Status.isLoading },
            week4: { status: week4Status.data?.status, loading: week4Status.isLoading }
        } : 'Not fetching - missing driver/period selection',
        allWeeksSigned,
        isLoading
    });
    
    return {
        isPeriodSigned: allWeeksSigned,
        isLoading,
        weekStatuses: [week1Status, week2Status, week3Status, week4Status]
    };
}; 