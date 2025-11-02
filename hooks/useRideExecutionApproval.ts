import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { 
  RideExecution, 
  RideWithExecutions, 
  ExecutionComment 
} from '@/types/rideExecutionApproval';

// Hook to get rides with executions (with status filter only - date/driver filtering on frontend)
export const useRidesPendingApproval = (companyId?: string, statusFilter?: string) => {
  return useQuery<RideWithExecutions[], Error>({
    queryKey: ['ridesPendingApproval', companyId, statusFilter],
    queryFn: async () => {
      try {
        // Build query parameters (only company and status sent to backend)
        const params = new URLSearchParams();
        if (companyId) {
          params.append('companyId', companyId);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        } else {
          // Default to 'all' to get all execution statuses
          params.append('status', 'all');
        }
        
        const queryString = params.toString();
        const endpoint = `/rides/pending-approval${queryString ? `?${queryString}` : ''}`;
        console.log('Fetching rides with executions:', endpoint);
        
        const response = await api.get<ApiResponse<RideWithExecutions[]>>(endpoint);

        console.log('Rides API Response:', response.data);

                // Check isSuccess field
                if (!response.data.isSuccess) {
                  const errorMessage = response.data.errors?.[0] || 'Failed to fetch rides';
                  console.error('API Error:', errorMessage);
                  throw new Error(errorMessage);
                }

        return response.data.data || [];
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
                throw new Error(apiError.response?.data?.errors?.[0] || apiError.message || 'Failed to fetch rides');
      }
    }
  });
};

// Hook to get all executions for a ride
export const useRideExecutions = (rideId: string) => {
  return useQuery<RideExecution[], Error>({
    queryKey: ['rideExecutions', rideId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RideExecution[]>>(
        `/rides/${rideId}/executions`
      );

      if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch ride executions');
      }

      return response.data.data || [];
    },
    enabled: !!rideId
  });
};

// Hook to approve individual driver execution
export const useApproveExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rideId, driverId }: { rideId: string; driverId: string }) => {
      try {
        console.log('Approving execution:', { rideId, driverId });
        
        const response = await api.put<ApiResponse<{ message: string }>>(
          `/rides/${rideId}/executions/${driverId}/approve`
        );

        console.log('Approval API Response:', response.data);
        console.log('Full response:', response);

                // Check isSuccess field
                if (!response.data.isSuccess) {
                  const errorMessage = response.data.errors?.[0] || 'Failed to approve execution';
                  console.error('Approval API Error:', errorMessage);
                  throw new Error(errorMessage);
                }

        console.log('Approval successful');
        return response.data;
      } catch (apiError: any) {
        console.error('Approval API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        
                throw new Error(apiError.response?.data?.errors?.[0] || apiError.message || 'Failed to approve execution');
      }
    },
    onSuccess: (data, variables) => {
      console.log('Approval mutation success, invalidating queries...');
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', variables.rideId] });
      
      // Also refetch the data immediately
      queryClient.refetchQueries({ queryKey: ['ridesPendingApproval'] });
    }
  });
};

// Hook to bulk approve all executions for a ride
export const useBulkApproveExecutions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rideId: string) => {
      const response = await api.put<ApiResponse<{ message: string; approvedCount: number }>>(
        `/rides/${rideId}/executions/bulk-approve`
      );

                if (!response.data.isSuccess) {
                  throw new Error(response.data.errors?.[0] || 'Failed to bulk approve executions');
                }

      return response.data.data;
    },
    onSuccess: (data, rideId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', rideId] });
    }
  });
};

// Hook to reject individual driver execution
export const useRejectExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      rideId, 
      driverId, 
      comment 
    }: { 
      rideId: string; 
      driverId: string; 
      comment?: string; 
    }) => {
      try {
        console.log('Rejecting execution:', { rideId, driverId, comment });
        
        const response = await api.put<ApiResponse<{ message: string }>>(
          `/rides/${rideId}/executions/${driverId}/reject`,
          comment ? { comment } : {}
        );

        console.log('Rejection API Response:', response.data);

                // Check isSuccess field
                if (!response.data.isSuccess) {
                  const errorMessage = response.data.errors?.[0] || 'Failed to reject execution';
                  console.error('Rejection API Error:', errorMessage);
                  throw new Error(errorMessage);
                }

        console.log('Rejection successful');
        return response.data;
      } catch (apiError: any) {
        console.error('Rejection API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        
                throw new Error(apiError.response?.data?.errors?.[0] || apiError.message || 'Failed to reject execution');
      }
    },
    onSuccess: (data, variables) => {
      console.log('Rejection mutation success, invalidating queries...');
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', variables.rideId] });
      
      // Also refetch the data immediately
      queryClient.refetchQueries({ queryKey: ['ridesPendingApproval'] });
    }
  });
};

// Hook to add comment to driver execution
export const useAddExecutionComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      rideId, 
      driverId, 
      comment 
    }: { 
      rideId: string; 
      driverId: string; 
      comment: string; 
    }) => {
      try {
        console.log('Adding comment:', { rideId, driverId, comment });
        
        const response = await api.post<ApiResponse<ExecutionComment>>(
          `/rides/${rideId}/executions/${driverId}/comments`,
          { comment }
        );

        console.log('Add comment API Response:', response.data);
        console.log('Full response:', response);

        // Check isSuccess field
        if (!response.data.isSuccess) {
          const errorMessage = response.data.errors?.[0] || 'Failed to add comment';
          console.error('Add comment API Error:', errorMessage);
          throw new Error(errorMessage);
        }

        console.log('Comment added successfully');
        return response.data.data;
      } catch (apiError: any) {
        console.error('Add comment API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        throw new Error(apiError.response?.data?.errors?.[0] || apiError.message || 'Failed to add comment');
      }
    },
    onSuccess: (data, variables) => {
      console.log('Add comment mutation success, invalidating queries...');
      // Invalidate comments query
      queryClient.invalidateQueries({ 
        queryKey: ['executionComments', variables.rideId, variables.driverId] 
      });
      queryClient.refetchQueries({ 
        queryKey: ['executionComments', variables.rideId, variables.driverId] 
      });
    }
  });
};

// Hook to get comments for driver execution
export const useExecutionComments = (rideId: string, driverId: string) => {
  return useQuery<ExecutionComment[], Error>({
    queryKey: ['executionComments', rideId, driverId],
    queryFn: async () => {
      try {
        console.log('Fetching comments for:', { rideId, driverId });
        
        const response = await api.get<ApiResponse<ExecutionComment[]>>(
          `/rides/${rideId}/executions/${driverId}/comments`
        );

        console.log('Fetch comments API Response:', response.data);

        // Check isSuccess field
        if (!response.data.isSuccess) {
          const errorMessage = response.data.errors?.[0] || 'Failed to fetch comments';
          console.error('Fetch comments API Error:', errorMessage);
          throw new Error(errorMessage);
        }

        return response.data.data || [];
      } catch (apiError: any) {
        console.error('Fetch comments API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        throw new Error(apiError.response?.data?.errors?.[0] || apiError.message || 'Failed to fetch comments');
      }
    },
    enabled: !!rideId && !!driverId
  });
};
