'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// Types for dispute system
export interface RideExecutionDispute {
  id: string;
  rideDriverExecutionId: string;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  reason: string;
  status: 'Open' | 'Resolved' | 'Closed';
  createdAtUtc: string;
  resolvedAtUtc?: string;
  closedAtUtc?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  resolutionType?: 'Accept' | 'Reject'; // NEW: Resolution decision
  comments: RideExecutionDisputeComment[];
}

export interface RideExecutionDisputeComment {
  id: string;
  disputeId: string;
  authorUserId: string;
  authorFirstName: string;
  authorLastName: string;
  body: string;
  createdAtUtc: string;
}

export interface CreateDisputeRequest {
  reason: string;
}

export interface AddCommentRequest {
  body: string;
}

export interface CloseDisputeRequest {
  resolutionType: 'accept' | 'reject';
  resolutionNotes: string;
}

// Hook to get driver's own disputes for a ride
export const useMyExecutionDisputes = (rideId: string) => {
  return useQuery({
    queryKey: ['myExecutionDisputes', rideId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RideExecutionDispute[]>>(
        `/rides/${rideId}/my-execution/disputes`
      );
      
      const isSuccess = response.data.isSuccess;
      if (!isSuccess) {
        const errorMessage = response.data.errors?.[0] || 'Failed to fetch disputes';
        throw new Error(errorMessage);
      }
      
      return response.data.data || [];
    },
    enabled: !!rideId,
  });
};

// Hook to get disputes for a specific driver's execution (admin view)
export const useDriverExecutionDisputes = (rideId: string, driverId: string) => {
  return useQuery({
    queryKey: ['driverExecutionDisputes', rideId, driverId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RideExecutionDispute[]>>(
        `/rides/${rideId}/executions/${driverId}/disputes`
      );
      
      const isSuccess = response.data.isSuccess;
      if (!isSuccess) {
        const errorMessage = response.data.errors?.[0] || 'Failed to fetch disputes';
        throw new Error(errorMessage);
      }
      
      return response.data.data || [];
    },
    enabled: !!rideId && !!driverId,
  });
};

// Hook to create a new dispute
export const useCreateExecutionDispute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ rideId, request }: { rideId: string; request: CreateDisputeRequest }) => {
      const response = await api.post<ApiResponse<RideExecutionDispute>>(
        `/rides/${rideId}/my-execution/disputes`,
        request
      );
      
      const isSuccess = response.data.isSuccess;
      if (!isSuccess) {
        const errorMessage = response.data.errors?.[0] || 'Failed to create dispute';
        throw new Error(errorMessage);
      }
      
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch disputes
      queryClient.invalidateQueries({ queryKey: ['myExecutionDisputes', variables.rideId] });
      queryClient.refetchQueries({ queryKey: ['myExecutionDisputes', variables.rideId] });
      
      // Also invalidate the execution data to update status
      queryClient.invalidateQueries({ queryKey: ['myAssignedRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecution', variables.rideId] });
    },
  });
};

// Hook to add a comment to a dispute
export const useAddDisputeComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ disputeId, request }: { disputeId: string; request: AddCommentRequest }) => {
      const response = await api.post<ApiResponse<RideExecutionDisputeComment>>(
        `/execution-disputes/${disputeId}/comments`,
        request
      );
      
      const isSuccess = response.data.isSuccess;
      if (!isSuccess) {
        const errorMessage = response.data.errors?.[0] || 'Failed to add comment';
        throw new Error(errorMessage);
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all dispute queries to refresh comments
      queryClient.invalidateQueries({ queryKey: ['myExecutionDisputes'] });
      queryClient.invalidateQueries({ queryKey: ['driverExecutionDisputes'] });
      queryClient.refetchQueries({ queryKey: ['myExecutionDisputes'] });
      queryClient.refetchQueries({ queryKey: ['driverExecutionDisputes'] });
    },
  });
};

// Hook to close a dispute (admin only)
export const useCloseExecutionDispute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ disputeId, request }: { disputeId: string; request: CloseDisputeRequest }) => {
      const response = await api.put<ApiResponse<RideExecutionDispute>>(
        `/execution-disputes/${disputeId}/close`,
        request
      );
      
      const isSuccess = response.data.isSuccess;
      if (!isSuccess) {
        const errorMessage = response.data.errors?.[0] || 'Failed to close dispute';
        throw new Error(errorMessage);
      }
      
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all dispute and execution queries
      queryClient.invalidateQueries({ queryKey: ['myExecutionDisputes'] });
      queryClient.invalidateQueries({ queryKey: ['driverExecutionDisputes'] });
      queryClient.invalidateQueries({ queryKey: ['ridesPendingApproval'] });
      queryClient.invalidateQueries({ queryKey: ['myAssignedRides'] });
      queryClient.refetchQueries({ queryKey: ['myExecutionDisputes'] });
      queryClient.refetchQueries({ queryKey: ['driverExecutionDisputes'] });
      queryClient.refetchQueries({ queryKey: ['ridesPendingApproval'] });
    },
  });
};
