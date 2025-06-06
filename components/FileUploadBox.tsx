import React, { useRef, useState } from 'react';
import { Box, Typography, CircularProgress, IconButton, List, ListItem, ListItemText, Link } from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useFileUploadMutation } from '@/hooks/useFileUpload';
import { UploadFile } from '@mui/icons-material';

export interface FileUploadBoxProps {
  uploadUrl: string;
  onChange?: (files: FileUploadStatus[]) => void;
  maxSizeMB?: number;
  accept?: string;
  initialFiles?: FileUploadStatus[];
}

export interface FileUploadStatus {
  name: string;
  size: number;
  status: 'loading' | 'complete' | 'error';
  url?: string;
  errorMsg?: string;
}

const defaultAccept = 'image/png,image/jpeg,application/pdf';
const defaultMaxSize = 10;

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  uploadUrl,
  onChange,
  maxSizeMB = defaultMaxSize,
  accept = defaultAccept,
  initialFiles = [],
}) => {
  const [files, setFiles] = useState<FileUploadStatus[]>(initialFiles);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useFileUploadMutation(uploadUrl);

  // To allow re-uploading the same file name after removal, reset input value
  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: FileUploadStatus[] = [];
    Array.from(fileList).forEach((file) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        newFiles.push({
          name: file.name,
          size: file.size,
          status: 'error',
          errorMsg: 'File too large',
        });
      } else {
        newFiles.push({
          name: file.name,
          size: file.size,
          status: 'loading',
        });
        uploadFile(file);
      }
    });
    setFiles((prev) => [...prev, ...newFiles]);
    if (onChange) onChange([...files, ...newFiles]);
    resetInput();
  };

  const uploadFile = async (file: File) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.name === file.name && f.status === 'loading'
          ? { ...f, status: 'loading' }
          : f
      )
    );
    try {
        const { url } = await uploadMutation.mutateAsync(file);
              setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: 'complete', url }
            : f
        )
      );
      if (onChange)
        onChange(
          files.map((f) =>
            f.name === file.name ? { ...f, status: 'complete', url } : f
          )
        );
    } catch (e: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: 'error', errorMsg: e.message || 'Upload failed' }
            : f
        )
      );
      if (onChange)
        onChange(
          files.map((f) =>
            f.name === file.name
              ? { ...f, status: 'error', errorMsg: e.message || 'Upload failed' }
              : f
          )
        );
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    if (onChange) onChange(files.filter((f) => f.name !== name));
    resetInput();
  };

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
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Box display="flex" flexDirection="column" alignItems="center" py={3}>
        <UploadFile sx={{ fontSize: 38, color: '#1976d2', mb: 1 }} />
        <Link
          underline="hover"
          color="#1976d2"
          fontWeight={400}
          sx={{ cursor: 'pointer', fontSize: 18 }}
          onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Choose files to upload
        </Link>
        <Typography variant="body2" color="text.secondary" mt={1}>
          PNG, JPG, PDF (max. {maxSizeMB}MB per file).
        </Typography>
      </Box>
      <List sx={{ mt: 0, px: 2, pb: 2 }}>
        {files.map((file) => (
          <ListItem
            key={file.name}
            disableGutters
            secondaryAction={
              <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleRemove(file.name); }}>
                <DeleteOutlineIcon />
              </IconButton>
            }
            sx={{ alignItems: 'flex-start', py: 0.5 }}
          >
            <InsertDriveFileOutlinedIcon sx={{ color: '#1976d2', fontSize: 22, mt: 0.5, mr: 1 }} />
            <ListItemText
              primary={<span style={{ fontSize: 15 }}>{file.name}</span>}
              secondary={
                <>
                  <span style={{ fontSize: 13, color: '#888' }}>{(file.size / 1024).toFixed(0)}kb</span>
                  {file.status === 'loading' && (
                    <>
                      <CircularProgress size={18} sx={{ ml: 1, verticalAlign: 'middle' }} />
                      <span style={{ color: '#888', marginLeft: 8 }}>Loading</span>
                    </>
                  )}
                  {file.status === 'complete' && (
                    <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18, ml: 1, verticalAlign: 'middle' }} />
                  )}
                  {file.status === 'error' && (
                    <>
                      <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 18, ml: 1, verticalAlign: 'middle' }} />
                      <span style={{ color: '#d32f2f', marginLeft: 8, fontWeight: 500 }}>Upload failed.</span>
                      <br />
                      <span style={{ color: '#d32f2f', fontSize: 12 }}>{file.errorMsg}</span>
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