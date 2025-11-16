import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { SubmitExecutionRequest, RideDriverExecution, RideExecutions } from '@/types/rideExecution';

// Hook to submit or update driver's own execution
export const useSubmitExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rideId,
      data
    }: {
      rideId: string;
      data: SubmitExecutionRequest;
    }) => {
      console.log('📤 [useSubmitExecution] Submitting execution for ride:', rideId);
      console.log('📤 [useSubmitExecution] Submission data:', data);
      
      const response = await api.put<ApiResponse<RideDriverExecution>>(
        `/rides/${rideId}/my-execution`,
        data
      );

      console.log('📥 [useSubmitExecution] Raw response:', response.data);
      console.log('📥 [useSubmitExecution] Response data object:', response.data.data);

      if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to submit execution');
      }

      const executionData = response.data.data;
      console.log('✅ [useSubmitExecution] Success! Returned execution data:', executionData);
      console.log('💰 [useSubmitExecution] Compensation fields in response:', {
        hourlyCompensation: executionData?.hourlyCompensation,
        totalCompensation: executionData?.totalCompensation,
        exceedingContainerWaitingTime: executionData?.exceedingContainerWaitingTime,
        nightAllowance: executionData?.nightAllowance,
        kilometerReimbursement: executionData?.kilometerReimbursement,
        consignmentFee: executionData?.consignmentFee,
        taxFreeCompensation: executionData?.taxFreeCompensation,
        variousCompensation: executionData?.variousCompensation,
      });

      return executionData;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['myRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecution', variables.rideId] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', variables.rideId] });
      queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
      
      // If files were included in submission, invalidate files query too
      if (variables.data.files && variables.data.files.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['executionFiles', variables.rideId] });
      }
    }
  });
};

// Hook to get driver's own execution for a ride
export const useMyExecution = (rideId: string) => {
  return useQuery<RideDriverExecution | null, Error>({
    queryKey: ['rideExecution', rideId],
    queryFn: async () => {
      try {
        console.log('🔍 [useMyExecution] Fetching execution for ride:', rideId);
        const response = await api.get<ApiResponse<RideDriverExecution>>(
          `/rides/${rideId}/my-execution`
        );

        console.log('📥 [useMyExecution] Raw response:', response.data);
        console.log('📥 [useMyExecution] Response data object:', response.data.data);

        if (response.data.isSuccess) {
          const executionData = response.data.data;
          console.log('✅ [useMyExecution] Success! Execution data:', executionData);
          console.log('💰 [useMyExecution] Compensation fields:', {
            hourlyCompensation: executionData?.hourlyCompensation,
            totalCompensation: executionData?.totalCompensation,
            exceedingContainerWaitingTime: executionData?.exceedingContainerWaitingTime,
            nightAllowance: executionData?.nightAllowance,
            kilometerReimbursement: executionData?.kilometerReimbursement,
            consignmentFee: executionData?.consignmentFee,
            taxFreeCompensation: executionData?.taxFreeCompensation,
            variousCompensation: executionData?.variousCompensation,
          });
          return executionData;
        }

        throw new Error(response.data.errors?.[0] || 'Failed to fetch execution');
      } catch (error: any) {
        // Return null if execution doesn't exist yet (404)
        if (error.response?.status === 404) {
          console.log('ℹ️ [useMyExecution] No execution found (404) - this is expected for new rides');
          return null;
        }
        console.error('❌ [useMyExecution] Error fetching execution:', error);
        throw error;
      }
    },
    enabled: !!rideId
  });
};

// Hook to get all driver executions for a ride (admin view)
export const useRideExecutions = (rideId: string) => {
  return useQuery<RideExecutions, Error>({
    queryKey: ['rideExecutions', rideId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RideExecutions>>(
        `/rides/${rideId}/executions`
      );

      if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch executions');
      }

      return response.data.data;
    },
    enabled: !!rideId
  });
};

// Hook to delete driver's own execution
export const useDeleteMyExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rideId: string) => {
      const response = await api.delete<ApiResponse<void>>(
        `/rides/${rideId}/my-execution`
      );

      if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to delete execution');
      }

      return response.data;
    },
    onSuccess: (data, rideId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['myRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecution', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', rideId] });
      queryClient.invalidateQueries({ queryKey: ['weekly-rides'] });
    }
  });
};
