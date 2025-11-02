import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { 
  RideExecution, 
  RideWithExecutions, 
  ExecutionComment 
} from '@/types/rideExecutionApproval';

// Hook to get rides pending approval
export const useRidesPendingApproval = (companyId?: string) => {
  return useQuery<RideWithExecutions[], Error>({
    queryKey: ['ridesPendingApproval', companyId],
    queryFn: async () => {
      try {
        // First, try the intended endpoint
        const params = companyId ? `?companyId=${companyId}` : '';
        console.log('Trying rides pending approval endpoint:', `/rides/pending-approval${params}`);
        
        try {
          const response = await api.get<ApiResponse<RideWithExecutions[]>>(
            `/rides/pending-approval${params}`
          );

          console.log('Pending approval API Response:', response.data);

          // Handle both success and isSuccess fields
          const isSuccess = response.data.success || response.data.isSuccess;
          if (!isSuccess) {
            const errorMessage = response.data.error || response.data.errors?.[0] || response.data.message || 'Failed to fetch pending rides';
            console.error('API Error:', errorMessage);
            throw new Error(errorMessage);
          }

          return response.data.data || [];
        } catch (pendingError: any) {
          // If the pending-approval endpoint doesn't exist, try regular rides endpoint
          if (pendingError.response?.status === 404) {
            console.log('Pending approval endpoint not found, trying regular rides endpoint...');
            
            const regularParams = new URLSearchParams();
            if (companyId) {
              regularParams.append('companyId', companyId);
            }
            regularParams.append('pageNumber', '1');
            regularParams.append('pageSize', '100');
            
            const queryString = regularParams.toString();
            const endpoint = `/rides${queryString ? `?${queryString}` : ''}`;
            console.log('Fetching regular rides:', endpoint);
            
            const ridesResponse = await api.get<ApiResponse<any>>(endpoint);
            console.log('Regular rides API Response:', ridesResponse.data);

            // Handle both success and isSuccess fields
            const isSuccess = ridesResponse.data.success || ridesResponse.data.isSuccess;
            if (!isSuccess) {
              const errorMessage = ridesResponse.data.error || ridesResponse.data.errors?.[0] || ridesResponse.data.message || 'Failed to fetch rides';
              console.error('Regular rides API Error:', errorMessage);
              throw new Error(errorMessage);
            }

            // Transform regular rides data to match our expected format if possible
            const ridesData = ridesResponse.data.data;
            if (ridesData && Array.isArray(ridesData)) {
              console.log('Found rides data, transforming to execution format...');
              
              // Transform rides to RideWithExecutions format
              const transformedRides: RideWithExecutions[] = ridesData.map((ride: any) => ({
                rideId: ride.id || ride.rideId,
                plannedDate: ride.plannedDate || ride.date,
                plannedStartTime: ride.plannedStartTime || ride.startTime || '00:00',
                plannedEndTime: ride.plannedEndTime || ride.endTime || '23:59',
                routeFromName: ride.routeFromName || ride.fromLocation || 'Unknown',
                routeToName: ride.routeToName || ride.toLocation || 'Unknown',
                tripNumber: ride.tripNumber || ride.number || '',
                clientName: ride.clientName || ride.client || 'Unknown Client',
                companyName: ride.companyName || ride.company || 'Unknown Company',
                truckLicensePlate: ride.truckLicensePlate || ride.truck || 'Unknown Truck',
                executionCompletionStatus: ride.executionCompletionStatus || 'none',
                executions: [] // Empty for now since we don't have execution data
              }));
              
              console.log('Transformed rides:', transformedRides);
              return transformedRides;
            }
            
            console.log('No rides data found, returning empty array');
            return [];
          } else {
            // Re-throw other errors
            throw pendingError;
          }
        }
      } catch (apiError: any) {
        console.error('API call failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        throw new Error(apiError.response?.data?.message || apiError.response?.data?.error || apiError.message || 'Failed to fetch rides');
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

      if (!response.data.success) {
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
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/rides/${rideId}/executions/${driverId}/approve`
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0] || 'Failed to approve execution');
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', variables.rideId] });
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

      if (!response.data.success) {
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
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/rides/${rideId}/executions/${driverId}/reject`,
        comment ? { comment } : {}
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0] || 'Failed to reject execution');
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecutions', variables.rideId] });
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
      const response = await api.post<ApiResponse<ExecutionComment>>(
        `/rides/${rideId}/executions/${driverId}/comments`,
        { comment }
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0] || 'Failed to add comment');
      }

      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate comments query
      queryClient.invalidateQueries({ 
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
      const response = await api.get<ApiResponse<ExecutionComment[]>>(
        `/rides/${rideId}/executions/${driverId}/comments`
      );

      if (!response.data.success) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch comments');
      }

      return response.data.data || [];
    },
    enabled: !!rideId && !!driverId
  });
};
