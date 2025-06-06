import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';

// --- TYPES ---
export type FileUploadInput = {
  file: File;
};

export type FileUploadResponse = {
  url: string;
};

// --- API CALL ---
const uploadFile = async (uploadUrl: string, { file }: FileUploadInput): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.postForm<FileUploadResponse>(uploadUrl, formData);
  if (response.data?.url) {
    return response.data;
  }
  throw new Error('Upload failed');
};

// --- MUTATION HOOK ---
export const useFileUploadMutation = (uploadUrl: string) => {
  return useMutation({
    mutationFn: (file: File) => uploadFile(uploadUrl, { file }),
    // onSuccess: (data) => { /* Optionally invalidate or refetch queries */ },
  });
}; 