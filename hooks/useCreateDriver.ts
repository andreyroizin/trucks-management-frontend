import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import axios from 'axios';

// --- TYPES ---
export type CreateDriverInput = {
    // Group 1: Personal Information (Required fields)
    Email: string;
    Password: string;
    FirstName: string;
    LastName: string;
    
    // Group 2: Company Assignment (Required)
    CompanyId: string;
    
    // Group 3: Employment Details (Required fields)
    DateOfEmployment: string;
    WorkweekDuration: number;
    Function: string;
    
    // Group 1: Personal Information (Optional fields)
    Address?: string;
    PhoneNumber?: string;
    Postcode?: string;
    City?: string;
    Country?: string;
    DateOfBirth?: string;
    BSN?: string;
    IBAN?: string;
    Remark?: string;
    
    // Group 3: Employment Details (Optional fields)
    WorkweekDurationPercentage?: number;
    ProbationPeriod?: string;
    WeeklySchedule?: string;
    WorkingHours?: string;
    NoticePeriod?: string;
    LastWorkingDay?: string;
    
    // Group 4: Work Allowances & Settings
    NightHoursAllowed?: boolean;
    KilometersAllowanceAllowed?: boolean;
    CommuteKilometers?: number;
    
    // Group 5: Salary & Compensation
    PayScale?: string;
    PayScaleStep?: string;
    CompensationPerMonthExclBtw?: number;
    CompensationPerMonthInclBtw?: number;
    HourlyWage100Percent?: number;
    DeviatingWage?: number;
    
    // Group 6: Travel & Expenses
    TravelExpenses?: number;
    MaxTravelExpenses?: number;
    
    // Group 7: Vacation & Benefits
    VacationDays?: number;
    VacationAge?: number;
    Atv?: number;
    VacationAllowance?: number;
    
    // Group 8: File Operations
    NewUploads?: {
        fileId: string;
        originalFileName: string;
    }[];
};

export type CreateDriverResponse = {
    UserId: string;
    DriverId: string;
    ContractId: string;
    Email: string;
    FullName: string;
    CompanyName: string;
    ContractStatus: string;
    DateOfEmployment: string;
    Function: string;
    WorkweekDuration: number;
    contractVersionId?: string; // ID of the generated contract PDF version
};

// --- API CALL ---
const createDriver = async (driver: CreateDriverInput): Promise<CreateDriverResponse> => {
    const safePayload = {
        ...driver,
        Password: driver.Password ? '***masked***' : undefined,
    };
    console.log('[useCreateDriver] Submitting create driver request', safePayload);

    try {
        const response = await api.post<ApiResponse<CreateDriverResponse>>('/drivers/create-with-contract', driver);
        console.log('[useCreateDriver] Received create driver response', response.data);

        if (response.data.isSuccess) {
            return response.data.data;
        }

        console.error('[useCreateDriver] Create driver failed with response', response.data);
        throw new Error(response.data.errors?.[0] || 'Failed to create driver');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                '[useCreateDriver] Axios error while creating driver',
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
                                'Failed to create driver';
            throw new Error(errorMessage);
        } else {
            console.error('[useCreateDriver] Unexpected error while creating driver', error);
        }
        throw error instanceof Error ? error : new Error('Failed to create driver');
    }
};

// --- MUTATION HOOK ---
export const useCreateDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<CreateDriverResponse, Error, CreateDriverInput>({
        mutationFn: createDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
}; 