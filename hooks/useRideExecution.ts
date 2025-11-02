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
      const response = await api.put<ApiResponse<RideDriverExecution>>(
        `/rides/${rideId}/my-execution`,
        data
      );

      if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to submit execution');
      }

      return response.data.data;
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
        const response = await api.get<ApiResponse<RideDriverExecution>>(
          `/rides/${rideId}/my-execution`
        );

        if (response.data.isSuccess) {
          return response.data.data;
        }

        throw new Error(response.data.errors?.[0] || 'Failed to fetch execution');
      } catch (error: any) {
        // Return null if execution doesn't exist yet (404)
        if (error.response?.status === 404) {
          return null;
        }
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
