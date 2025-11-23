import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export interface AssignCarToDriverRequest {
    carId?: string | null;
    companyId?: string;
}

export interface DriverCarInfo {
    driverId: string;
    companyId: string;
    companyName: string;
    carId: string | null;
    carLicensePlate: string | null;
    carVehicleYear: number | null;
    carRegistrationDate: string | null;
}

// --- API CALL ---
const assignCarToDriver = async (
    userId: string, 
    data: AssignCarToDriverRequest
): Promise<DriverCarInfo> => {
    console.log('🔧 [API] assignCarToDriver called');
    console.log('🔧 [API] userId:', userId, 'type:', typeof userId);
    console.log('🔧 [API] data:', data);
    console.log('🔧 [API] endpoint:', `/users/${userId}/driver`);
    
    try {
    const response = await api.put<ApiResponse<DriverCarInfo>>(`/users/${userId}/driver`, data);
        
        console.log('✅ [API] Response received:', response);
        console.log('✅ [API] Response status:', response.status);
        console.log('✅ [API] Response data:', response.data);
    
    if (!response.data.isSuccess) {
            console.error('❌ [API] Backend returned isSuccess=false');
            console.error('❌ [API] Errors:', response.data.errors);
        throw new Error(response.data.errors?.[0] || 'Failed to assign car to driver');
    }
    
        console.log('✅ [API] Assignment successful, returning data:', response.data.data);
    return response.data.data;
    } catch (error: any) {
        console.error('❌ [API] Request failed with error:', error);
        console.error('❌ [API] Error message:', error.message);
        console.error('❌ [API] Error response:', error.response);
        console.error('❌ [API] Error response data:', error.response?.data);
        console.error('❌ [API] Error response status:', error.response?.status);
        console.error('❌ [API] Error response headers:', error.response?.headers);
        
        // 🔍 CRITICAL: Log the actual backend error messages
        if (error.response?.data?.errors) {
            console.error('🚨 [API] BACKEND ERROR MESSAGES:');
            error.response.data.errors.forEach((err: string, index: number) => {
                console.error(`🚨 [API] Error ${index + 1}: "${err}"`);
            });
        }
        
        throw error;
    }
};

// --- HOOK ---
export const useAssignCarToDriver = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ userId, ...data }: AssignCarToDriverRequest & { userId: string }) => {
            console.log('🎣 [HOOK] Mutation function called');
            console.log('🎣 [HOOK] Full params:', { userId, ...data });
            console.log('🎣 [HOOK] Separated - userId:', userId);
            console.log('🎣 [HOOK] Separated - data:', data);
            return assignCarToDriver(userId, data);
        },
        onSuccess: (result) => {
            console.log('🎉 [HOOK] Mutation onSuccess called');
            console.log('🎉 [HOOK] Result:', result);
            console.log('🔄 [HOOK] Invalidating queries...');
            // Refresh relevant queries
            queryClient.invalidateQueries({ queryKey: ['carDetail'] });
            queryClient.invalidateQueries({ queryKey: ['cars'] });
            queryClient.invalidateQueries({ queryKey: ['drivers'] });
            queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
            console.log('✅ [HOOK] Queries invalidated');
        },
        onError: (error) => {
            console.error('💥 [HOOK] Mutation onError called');
            console.error('💥 [HOOK] Error:', error);
        },
    });
}; 