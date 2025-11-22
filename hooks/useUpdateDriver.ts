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
    
    // Used By Companies
    usedByCompanyIds?: string[];
    
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
    const url = `/drivers/${driverId}/with-contract`;
    const baseURL = api.defaults.baseURL || 'NOT SET';
    const fullURL = baseURL + url;
    
    console.log('📡 [useUpdateDriver] Submitting update driver request');
    console.log('  Driver ID:', driverId);
    console.log('  Method: PUT');
    console.log('  Endpoint:', url);
    console.log('  Base URL:', baseURL);
    console.log('  Full URL:', fullURL);
    console.log('  Payload:', JSON.stringify(data, null, 2));
    console.log('  🔍 usedByCompanyIds in payload:', data.usedByCompanyIds);
    console.log('  🔍 usedByCompanyIds type:', typeof data.usedByCompanyIds);
    console.log('  🔍 usedByCompanyIds is Array:', Array.isArray(data.usedByCompanyIds));
    
    try {
        const response = await api.put<ApiResponse<DriverWithContractResponse>>(url, data);
        
        console.log('✅ [useUpdateDriver] Received update driver response');
        console.log('  Status:', response.status);
        console.log('  Status Text:', response.statusText);
        console.log('  Response Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.isSuccess) {
            console.log('✅ [useUpdateDriver] Driver updated successfully');
            return response.data.data;
        }
        
        console.error('❌ [useUpdateDriver] Update driver failed - API returned isSuccess: false');
        console.error('  Response Data:', JSON.stringify(response.data, null, 2));
        console.error('  Errors:', response.data.errors);
        throw new Error(response.data.errors?.[0] || 'Failed to update driver');
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('❌ [useUpdateDriver] Axios error while updating driver');
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
            
            // Log request payload
            if (error.config?.data) {
                try {
                    const requestData = JSON.parse(error.config.data);
                    console.error('  Request Payload:', JSON.stringify(requestData, null, 2));
                } catch (e) {
                    console.error('  Request Payload (raw):', error.config.data);
                }
            }
            
            // Extract error message from axios error response
            const errorMessage = error.response?.data?.errors?.[0] || 
                                error.response?.data?.message ||
                                error.response?.data?.error ||
                                error.message || 
                                'Failed to update driver';
            
            console.error('  Extracted Error Message:', errorMessage);
            throw new Error(errorMessage);
        } else {
            console.error('❌ [useUpdateDriver] Unexpected error while updating driver');
            console.error('  Error Type:', typeof error);
            console.error('  Error:', error);
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