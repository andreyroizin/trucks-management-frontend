import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import axios from 'axios';

export interface UpdateDriverInput {
    // User Identity Updates
    email?: string;
    firstName?: string;
    lastName?: string;
    companyId?: string;
    
    // Contract Essentials
    dateOfEmployment?: string;
    workweekDuration?: number;
    function?: string;
    
    // Extended User Info
    address?: string;
    phoneNumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    remark?: string;
    
    // Contract Details
    dateOfBirth?: string;
    probationPeriod?: string;
    weeklySchedule?: string;
    workingHours?: string;
    noticePeriod?: string;
    payScale?: string;
    payScaleStep?: number;
    bsn?: string;
    iban?: string;
    lastWorkingDay?: string;
    
    // Additional Contract Fields
    vacationDays?: number;
    vacationAge?: number;
    workweekDurationPercentage?: number;
    
    // Allowances & Settings
    nightHoursAllowed?: boolean;
    kilometersAllowanceAllowed?: boolean;
    commuteKilometers?: number;
    
    // Compensation Details
    compensationPerMonthExclBtw?: number;
    compensationPerMonthInclBtw?: number;
    hourlyWage100Percent?: number;
    deviatingWage?: number;
    
    // Travel & Expenses
    travelExpenses?: number;
    maxTravelExpenses?: number;
    
    // Vacation Benefits
    atv?: number;
    vacationAllowance?: number;
    
    // Company Details Override
    employerName?: string;
    companyBtw?: string;
    companyKvk?: string;
    
    // Car Assignment
    carId?: string;
    
    // File Operations
    newUploads?: {
        fileId: string;
        originalFileName: string;
    }[];
    fileIdsToDelete?: string[];
}

export interface DriverWithContractResponse {
    success: boolean;
    data: any;
    message: string;
}

const updateDriverWithContract = async (driverId: string, data: UpdateDriverInput): Promise<DriverWithContractResponse> => {
    try {
        const response = await api.put<ApiResponse<DriverWithContractResponse>>(`/drivers/${driverId}/with-contract`, data);
        
        if (response.data.isSuccess) {
            return response.data.data;
        }
        
        console.error('[useUpdateDriver] Update driver failed with response', response.data);
        throw new Error(response.data.errors?.[0] || 'Failed to update driver');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                '[useUpdateDriver] Axios error while updating driver',
                {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                }
            );
            // Extract error message from axios error response
            const errorMessage = error.response?.data?.errors?.[0] || 
                                error.response?.data?.message || 
                                error.message || 
                                'Failed to update driver';
            throw new Error(errorMessage);
        } else {
            console.error('[useUpdateDriver] Unexpected error while updating driver', error);
        }
        throw error instanceof Error ? error : new Error('Failed to update driver');
    }
};

export const useUpdateDriver = () => {
    const queryClient = useQueryClient();
    
    return useMutation<DriverWithContractResponse, Error, { driverId: string; data: UpdateDriverInput }>({
        mutationFn: ({ driverId, data }) => updateDriverWithContract(driverId, data),
        onSuccess: (response, { driverId }) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['driverWithContract', driverId] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['carDetail'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
            queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
        },
    });
}; 