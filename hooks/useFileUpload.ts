import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { api } from '@/utils/api';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type FileUploadInput = { file: File };

export type FileUploadResponse = { fileId: string }; // what callers care about

/* Backend envelope shape:
{
  isSuccess: true,
  statusCode: 200,
  data: [{ fileId: string; fileName: string }],
  errors: null
}
*/
type BackendEnvelope = {
  isSuccess: boolean;
  statusCode: number;
  data: { fileId: string; fileName: string }[];
  errors: unknown;
};

/* ------------------------------------------------------------------ */
/* Upload helper                                                       */
/* ------------------------------------------------------------------ */

const uploadFile = async (
    uploadUrl: string,
    { file }: FileUploadInput,
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  // api.postForm wraps axios.post with multipart/form-data headers
  const res = await api.postForm<BackendEnvelope>(uploadUrl, formData);

  const fileId = res.data?.data?.[0]?.fileId;
  if (!fileId) {
    throw new Error('Upload failed: no fileId returned');
  }
  return { fileId };
};

/* ------------------------------------------------------------------ */
/* Mutation hook                                                       */
/* ------------------------------------------------------------------ */

/**
 * Returns a TanStack Query mutation for uploading a single file.
 *
 * @example
 * const upload = useFileUploadMutation('/temporary-uploads');
 * upload.mutate(file);
 */
export const useFileUploadMutation = (
    uploadUrl: string,
    options?: Partial<
        UseMutationOptions<FileUploadResponse, Error, File>
    >,
) =>
    useMutation<FileUploadResponse, Error, File>({
      mutationFn: (file) => uploadFile(uploadUrl, { file }),
      ...options, // caller can pass onSuccess / onError, etc.
    });