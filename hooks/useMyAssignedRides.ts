import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { MyAssignedRide, ExecutionFile, UploadFileRequest } from '@/types/myAssignedRides';

// Hook to get driver's assigned rides
export const useMyAssignedRides = (startDate?: string, endDate?: string) => {
  return useQuery<MyAssignedRide[], Error>({
    queryKey: ['myAssignedRides', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get<ApiResponse<MyAssignedRide[]>>(
        '/rides/my-assigned',
        { params }
      );


      // Check if response uses 'success' or 'isSuccess' field
      const isSuccess = response.data.success ?? response.data.isSuccess;
      const errorMessage = response.data.error ?? response.data.errors?.[0];
      const data = response.data.data ?? response.data;

      if (!isSuccess && response.status !== 200) {
        throw new Error(errorMessage || 'Failed to fetch assigned rides');
      }

      // If success field is missing but status is 200, assume success
      return Array.isArray(data) ? data : (data.data || data);
    }
  });
};

// Hook to delete driver's own execution
export const useDeleteMyExecution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rideId: string) => {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/rides/${rideId}/my-execution`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete execution');
      }

      return response.data.data;
    },
    onSuccess: (data, rideId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['myAssignedRides'] });
      queryClient.invalidateQueries({ queryKey: ['rideExecution', rideId] });
      queryClient.invalidateQueries({ queryKey: ['executionFiles', rideId] });
    }
  });
};

// Hook to get driver's execution files
export const useMyExecutionFiles = (rideId: string) => {
  return useQuery<ExecutionFile[], Error>({
    queryKey: ['executionFiles', rideId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ExecutionFile[]>>(
        `/rides/${rideId}/my-execution/files`
      );

      // Check for different response structures
      const isSuccess = response.data.success ?? response.data.isSuccess;
      const errorMessage = response.data.error ?? response.data.errors?.[0];
      const data = response.data.data ?? response.data;

      if (!isSuccess && response.status !== 200) {
        throw new Error(errorMessage || 'Failed to fetch files');
      }

      // If success field is missing but status is 200, assume success
      const filesData = Array.isArray(data) ? data : (data?.data || []);
      
      return filesData;
    },
    enabled: !!rideId
  });
};

// Hook to upload file to driver's execution
export const useUploadExecutionFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rideId, file }: { rideId: string; file: File }) => {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const request: UploadFileRequest = {
        fileName: file.name,
        contentType: file.type,
        fileDataBase64: base64
      };
      
      try {
        const response = await api.post<ApiResponse<ExecutionFile>>(
          `/rides/${rideId}/my-execution/files`,
          request
        );

        // Check for different response structures
        const isSuccess = response.data.success ?? response.data.isSuccess;
        const errorMessage = response.data.error ?? response.data.errors?.[0] ?? response.data.message;

        if (!isSuccess && response.status !== 200) {
          throw new Error(errorMessage || 'Failed to upload file');
        }

        // If success field is missing but status is 200, assume success
        if (response.status === 200) {
          return response.data.data || response.data;
        }
      } catch (apiError: any) {
        // Extract error message from different possible locations
        const errorMsg = apiError.response?.data?.error || 
                        apiError.response?.data?.errors?.[0] || 
                        apiError.response?.data?.message || 
                        apiError.message || 
                        'Failed to upload file';
        
        throw new Error(errorMsg);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch immediately for upload
      queryClient.invalidateQueries({ queryKey: ['executionFiles', variables.rideId] });
      queryClient.refetchQueries({ queryKey: ['executionFiles', variables.rideId] });
    }
  });
};

// Hook to delete execution file
export const useDeleteExecutionFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rideId, fileId }: { rideId: string; fileId: string }) => {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/rides/${rideId}/my-execution/files/${fileId}`
      );

      // Check for different response structures
      const isSuccess = response.data.success ?? response.data.isSuccess;
      const errorMessage = response.data.error ?? response.data.errors?.[0];

      if (!isSuccess && response.status !== 200) {
        throw new Error(errorMessage || 'Failed to delete file');
      }

      return response.data.data || response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch immediately for delete
      queryClient.invalidateQueries({ queryKey: ['executionFiles', variables.rideId] });
      queryClient.refetchQueries({ queryKey: ['executionFiles', variables.rideId] });
    }
  });
};

// Hook to download execution file
export const useDownloadExecutionFile = () => {
  return useMutation({
    mutationFn: async ({ rideId, fileId, fileName }: { rideId: string; fileId: string; fileName: string }) => {
      const response = await api.get(
        `/rides/${rideId}/my-execution/files/${fileId}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    }
  });
};

// Utility function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]; // Remove data:image/jpeg;base64, prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
