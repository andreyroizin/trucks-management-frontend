import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import axios from 'axios';
import { ContractTypeValue } from '@/constants/contractTypes';

// --- TYPES ---
export type CreateDriverInput = {
    // Group 1: Personal Information (Required fields)
    Email: string;
    Password: string;
    FirstName: string;
    LastName: string;
    
    // Group 2: Company Assignment (Required)
    CompanyId: string;

    // Contract type
    ContractType?: ContractTypeValue;

    // ZZP fields
    ZzpBtwNumber?: string;
    ZzpKvkNumber?: string;
    ZzpHourlyRateExclBtw?: number;
    ZzpBtwPercentage?: number;
    ZzpMediationFeePerWeek?: number;
    ZzpContractNumber?: string;
    ZzpWorkDescription?: string;
    ZzpLocation?: string;

    // Inleen fields
    InleenLendingCompanyId?: string;
    InleenBorrowingCompanyId?: string;
    InleenStartDate?: string;
    InleenEndDate?: string;
    InleenHourlyRate?: number;
    InleenWorkDescription?: string;
    InleenLocation?: string;

    // BriefLoonschaal fields
    BriefMonthlySalary?: number;
    BriefGrade?: string;
    BriefExpectedMonthlyHours?: number;
    
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
    
    // Group 9: Used By Companies
    UsedByCompanyIds?: string[];
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
    const url = '/drivers/create-with-contract';
    const baseURL = api.defaults.baseURL || 'NOT SET';
    const fullURL = baseURL + url;
    
    const safePayload = {
        ...driver,
        Password: driver.Password ? '***masked***' : undefined,
    };
    
    console.log('📡 [useCreateDriver] Submitting create driver request');
    console.log('  Method: POST');
    console.log('  Endpoint:', url);
    console.log('  Base URL:', baseURL);
    console.log('  Full URL:', fullURL);
    console.log('  Payload (safe):', JSON.stringify(safePayload, null, 2));

    try {
        const response = await api.post<ApiResponse<CreateDriverResponse>>(url, driver);
        
        console.log('✅ [useCreateDriver] Received create driver response');
        console.log('  Status:', response.status);
        console.log('  Status Text:', response.statusText);
        console.log('  Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.isSuccess) {
            console.log('✅ [useCreateDriver] Driver created successfully');
            console.log('  Driver ID:', response.data.data?.DriverId);
            console.log('  User ID:', response.data.data?.UserId);
            console.log('  Contract Version ID:', response.data.data?.contractVersionId);
        return response.data.data;
    }

        console.error('❌ [useCreateDriver] Create driver failed - API returned isSuccess: false');
        console.error('  Response Data:', JSON.stringify(response.data, null, 2));
        console.error('  Errors:', response.data.errors);
    throw new Error(response.data.errors?.[0] || 'Failed to create driver');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('❌ [useCreateDriver] Axios error while creating driver');
            console.error('  Status:', error.response?.status);
            console.error('  Status Text:', error.response?.statusText);
            console.error('  Error Message:', error.message);
            console.error('  Request URL:', error.config?.url);
            console.error('  Request Method:', error.config?.method?.toUpperCase());
            
            // Log full response data
            if (error.response?.data) {
                console.error('  Response Data (full):', JSON.stringify(error.response.data, null, 2));
                console.error('  Response Data (object):', error.response.data);
                
                // Log specific error fields
                if (error.response.data.errors) {
                    console.error('  Errors Array:', error.response.data.errors);
                    console.error('  First Error:', error.response.data.errors[0]);
                }
                if (error.response.data.message) {
                    console.error('  Error Message:', error.response.data.message);
                }
                if (error.response.data.error) {
                    console.error('  Error Field:', error.response.data.error);
                }
                if (error.response.data.stackTrace) {
                    console.error('  Stack Trace:', error.response.data.stackTrace);
                }
            } else if (error.request) {
                console.error('  No Response Received');
                console.error('  Request:', error.request);
            }
            
            // Log request payload (mask password)
            if (error.config?.data) {
                try {
                    const requestData = JSON.parse(error.config.data);
                    const safeRequestData = {
                        ...requestData,
                        Password: requestData.Password ? '***masked***' : undefined,
                    };
                    console.error('  Request Payload:', JSON.stringify(safeRequestData, null, 2));
                } catch (e) {
                    console.error('  Request Payload (raw):', error.config.data);
                }
            }
            
            // Extract error message from axios error response
            const errorMessage = error.response?.data?.errors?.[0] || 
                                error.response?.data?.message ||
                                error.response?.data?.error ||
                                error.message || 
                                'Failed to create driver';
            
            console.error('  Extracted Error Message:', errorMessage);
            throw new Error(errorMessage);
        } else {
            console.error('❌ [useCreateDriver] Unexpected error while creating driver');
            console.error('  Error Type:', typeof error);
            console.error('  Error:', error);
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