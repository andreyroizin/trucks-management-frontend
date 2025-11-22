import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { ApplicationFile } from '@/types/file';

export type CompanySimple = {
    id: string;
    name: string;
};

// Driver with Contract Response Type based on backend guide
export type DriverWithContract = {
    // Personal Information
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    bsn?: string;
    iban?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    
    // Company & Employment
    companyId: string;
    companyName: string;
    function?: string;
    dateOfEmployment?: string;
    
    // Work Conditions (what we need for the card)
    workweekDuration?: number;
    workweekDurationPercentage?: number;
    weeklySchedule?: string;
    workingHours?: string;
    probationPeriod?: string;
    noticePeriod?: string;
    
    // Contract Details
    contractId?: string;
    contractStatus?: string;
    signedAt?: string;
    accessCode?: string;
    releaseVersion?: string;
    lastWorkingDay?: string; // This is the contract end date
    
    // Compensation
    payScale?: string;
    payScaleStep?: string;
    compensationPerMonthExclBtw?: number;
    compensationPerMonthInclBtw?: number;
    hourlyWage100Percent?: number;
    deviatingWage?: number;
    
    // Travel & Expenses
    travelExpenses?: number;
    maxTravelExpenses?: number;
    commuteKilometers?: number;
    
    // Benefits
    vacationDays?: number;
    vacationAge?: number;
    atv?: number;
    vacationAllowance?: number;
    vacationHoursLeft?: number;
    
    // Car Assignment
    carId?: string;
    carLicensePlate?: string;
    carVehicleYear?: string;
    carRegistrationDate?: string;
    
    // User Status
    isApproved?: boolean;
    remark?: string;
    
    // Telegram Notifications
    telegramNotificationsEnabled?: boolean;
    telegramChatId?: number | null;
    telegramRegisteredAt?: string | null;
    
    // Used By Companies
    usedByCompanies: CompanySimple[];
    
    // Files
    files?: ApplicationFile[];
};

// API call function
const fetchDriverWithContract = async (driverId: string): Promise<DriverWithContract> => {
    const response = await api.get<ApiResponse<DriverWithContract>>(`/drivers/${driverId}/with-contract`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch driver details');
};

// React Query hook
export const useDriverWithContract = (driverId: string) => {
    return useQuery<DriverWithContract, Error>({
        queryKey: ['driverWithContract', driverId],
        queryFn: () => fetchDriverWithContract(driverId),
        enabled: !!driverId, // Only run if driverId is provided
    });
}; 