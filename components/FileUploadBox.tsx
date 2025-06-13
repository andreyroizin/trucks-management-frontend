import React, { useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { UploadFile } from '@mui/icons-material';
import { useFileUploadMutation } from '@/hooks/useFileUpload';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface FileUploadStatus {
  name: string;
  size: number;
  status: 'loading' | 'complete' | 'error';
  fileId?: string;
  errorMsg?: string;
}

export interface FileUploadBoxProps {
  uploadUrl: string;
  onChange?: (files: FileUploadStatus[]) => void;
  /** Optional: receive array of fileIds only */
  onIdsChange?: (ids: string[]) => void;
  maxSizeMB?: number;
  accept?: string;
  initialFiles?: FileUploadStatus[];
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const defaultAccept = 'image/png,image/jpeg,image/jpg,image/heic,application/pdf';
const defaultMaxSize = 10;

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
                                                       uploadUrl,
                                                       onChange,
                                                       onIdsChange,
                                                       maxSizeMB = defaultMaxSize,
                                                       accept = defaultAccept,
                                                       initialFiles = [],
                                                     }) => {
  const [files, setFiles] = useState<FileUploadStatus[]>(initialFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useFileUploadMutation(uploadUrl);

  /* -------------------------------------------------------------- */
  /* Helpers                                                         */
  /* -------------------------------------------------------------- */

  const pushUpdates = (next: FileUploadStatus[]) => {
    onChange?.(next);
    onIdsChange?.(next.filter((f) => f.fileId).map((f) => f.fileId!));
  };

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  /* -------------------------------------------------------------- */
  /* File selection/drag-drop                                        */
  /* -------------------------------------------------------------- */

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newEntries: FileUploadStatus[] = [];

    Array.from(fileList).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        newEntries.push({
          name: file.name,
          size: file.size,
          status: 'error',
          errorMsg: 'File too large',
        });
      } else {
        newEntries.push({
          name: file.name,
          size: file.size,
          status: 'loading',
        });
        uploadFile(file);
      }
    });

    setFiles((prev) => {
      const next = [...prev, ...newEntries];
      pushUpdates(next);
      return next;
    });

    resetInput();
  };

  /* -------------------------------------------------------------- */
  /* Actual upload                                                   */
  /* -------------------------------------------------------------- */

  const uploadFile = async (file: File) => {
    // ensure loading state (useful if the same file name gets re-clicked)
    setFiles((prev) =>
        prev.map((f) =>
            f.name === file.name ? { ...f, status: 'loading' as const } : f,
        ),
    );

    try {
      const { fileId } = await uploadMutation.mutateAsync(file);

      setFiles((prev) => {
        const next = prev.map((f) =>
            f.name === file.name
                ? { ...f, status: 'complete' as const, fileId }
                : f,
        );
        pushUpdates(next);
        return next;
      });
    } catch (err: any) {
      const errorMsg = err?.response?.data?.errors?.[0] || err?.message || 'Upload failed';
      setFiles((prev) => {
        const next = prev.map((f) =>
            f.name === file.name
                ? { ...f, status: 'error' as const, errorMsg }
                : f,
        );
        pushUpdates(next);
        return next;
      });
    }
  };

  /* -------------------------------------------------------------- */
  /* Remove a file                                                   */
  /* -------------------------------------------------------------- */

  const handleRemove = (name: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.name !== name);
      pushUpdates(next);
      return next;
    });
    resetInput();
  };

  /* -------------------------------------------------------------- */
  /* Drag-and-drop handler                                           */
  /* -------------------------------------------------------------- */

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  /* -------------------------------------------------------------- */
  /* UI                                                              */
  /* -------------------------------------------------------------- */

  return (
      <Box
          sx={{
            border: '1px dashed #c2c7d0',
            borderRadius: 2,
            p: 0,
            textAlign: 'center',
            bgcolor: '#fff',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            '&:hover': { borderColor: '#1976d2' },
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
      >
        {/* Hidden native input */}
        <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Dropzone header */}
        <Box display="flex" flexDirection="column" alignItems="center" py={3}>
          <UploadFile sx={{ fontSize: 38, color: '#1976d2', mb: 1 }} />
          <Link
              underline="hover"
              color="#1976d2"
              fontWeight={400}
              sx={{ cursor: 'pointer', fontSize: 18 }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
          >
            Choose files to upload
          </Link>
          <Typography variant="body2" color="text.secondary" mt={1}>
            PNG, JPG, PDF (max.&nbsp;{maxSizeMB}
            MB per file).
          </Typography>
        </Box>

        {/* List of files */}
        <List sx={{ mt: 0, px: 2, pb: 2 }}>
          {files.map((file) => (
              <ListItem
                  key={file.name}
                  disableGutters
                  secondaryAction={
                    <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(file.name);
                        }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  }
                  sx={{ alignItems: 'flex-start', py: 0.5 }}
              >
                <InsertDriveFileOutlinedIcon
                    sx={{ color: '#1976d2', fontSize: 22, mt: 0.5, mr: 1 }}
                />
                <ListItemText
                    primary={<span style={{ fontSize: 15 }}>{file.name}</span>}
                    secondary={
                      <>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    {(file.size / 1024).toFixed(0)}kb
                  </span>

                        {/* Loading */}
                        {file.status === 'loading' && (
                            <>
                              <CircularProgress
                                  size={18}
                                  sx={{ ml: 1, verticalAlign: 'middle' }}
                              />
                              <span style={{ color: '#888', marginLeft: 8 }}>
                        Loading
                      </span>
                            </>
                        )}

                        {/* Success */}
                        {file.status === 'complete' && (
                            <CheckCircleOutlineIcon
                                sx={{
                                  color: 'success.main',
                                  fontSize: 18,
                                  ml: 1,
                                  verticalAlign: 'middle',
                                }}
                            />
                        )}

                        {/* Error */}
                        {file.status === 'error' && (
                            <>
                              <ErrorOutlineIcon
                                  sx={{
                                    color: 'error.main',
                                    fontSize: 18,
                                    ml: 1,
                                    verticalAlign: 'middle',
                                  }}
                              />
                              <span
                                  style={{
                                    color: '#d32f2f',
                                    marginLeft: 8,
                                    fontWeight: 500,
                                  }}
                              >
                        Upload failed.
                      </span>
                              <br />
                              <span
                                  style={{ color: '#d32f2f', fontSize: 12 }}
                              >
                        {file.errorMsg}
                      </span>
                            </>
                        )}
                      </>
                    }
                    sx={{ mt: 0.5 }}
                />
              </ListItem>
          ))}
        </List>
      </Box>
  );
};

export default FileUploadBox;