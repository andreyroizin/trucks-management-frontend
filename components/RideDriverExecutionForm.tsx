'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Download as DownloadIcon, 
  Upload as UploadIcon,
  AttachFile as AttachFileIcon 
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { RideDriverExecution, SubmitExecutionRequest } from '@/types/rideExecution';
import { ExecutionFile } from '@/types/myAssignedRides';
import { useSubmitExecution, useDeleteMyExecution } from '@/hooks/useRideExecution';
import { 
  useMyExecutionFiles, 
  useUploadExecutionFile, 
  useDeleteExecutionFile, 
  useDownloadExecutionFile 
} from '@/hooks/useMyAssignedRides';
import { useSnack } from '@/providers/SnackProvider';
import { useAuth } from '@/hooks/useAuth';
import RideExecutionDisputeDialog from '@/components/RideExecutionDisputeDialog';

const numberTransform = (value: number, originalValue: unknown) =>
  originalValue === '' || originalValue === null ? undefined : value;

const timeStringTransform = (value: string | undefined, originalValue: unknown) => {
  if (typeof originalValue === 'string' && originalValue.trim() === '') {
    return undefined;
  }
  return value;
};

const normalizeTimeForInput = (value?: string | null) => {
  if (!value) return '';
  if (value.length === 8 && value.includes(':')) {
    return value.slice(0, 5);
  }
  return value;
};

const normalizeTimeForSubmission = (value?: string | null) => {
  if (!value) return undefined;
  if (value.length === 5) {
    return `${value}:00`;
  }
  return value;
};

const toOptionalNumber = (value?: number | null) => (value ?? undefined);

const parseNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const schema = yup.object({
  actualStartTime: yup.string().required('Start time is required'),
  actualEndTime: yup.string().required('End time is required'),
  actualRestTime: yup.string().required('Rest time is required'),
  containerWaitingTime: yup
    .string()
    .transform(timeStringTransform)
    .matches(/^(\d{2}):([0-5]\d)(:[0-5]\d)?$/, {
      message: 'Enter waiting time in HH:mm format',
      excludeEmptyString: true,
    })
    .nullable(),
  startKilometers: yup
    .number()
    .transform(numberTransform)
    .typeError('Start kilometers must be a number')
    .min(0, 'Start kilometers must be positive')
    .required('Start kilometers is required'),
  endKilometers: yup
    .number()
    .transform(numberTransform)
    .typeError('End kilometers must be a number')
    .min(0, 'End kilometers must be positive')
    .required('End kilometers is required')
    .test(
      'end-greater-than-start',
      'End kilometers must be greater than or equal to start kilometers',
      function (value) {
        const { startKilometers } = this.parent as { startKilometers?: number };
        if (value === undefined || value === null || startKilometers === undefined || startKilometers === null) {
          return true;
        }
        return value >= startKilometers;
      }
    ),
  actualKilometers: yup
    .number()
    .transform(numberTransform)
    .typeError('Total kilometers must be a number')
    .min(0, 'Total kilometers must be positive')
    .nullable(),
  extraKilometers: yup
    .number()
    .transform(numberTransform)
    .typeError('Extra kilometers must be a number')
    .min(0, 'Extra kilometers must be positive')
    .nullable(),
  actualCosts: yup
    .number()
    .transform(numberTransform)
    .typeError('Costs must be a number')
    .min(0, 'Costs must be positive')
    .nullable(),
  costsDescription: yup.string().optional(),
  turnover: yup
    .number()
    .transform(numberTransform)
    .typeError('Turnover must be a number')
    .min(0, 'Turnover must be positive')
    .nullable(),
  remark: yup.string().optional(),
  variousCompensation: yup
    .number()
    .transform(numberTransform)
    .typeError('Compensation must be a number')
    .min(0, 'Compensation must be positive')
    .nullable()
});

interface Props {
  rideId: string;
  execution?: RideDriverExecution | null;
  onSuccess?: () => void;
}

type FormValues = yup.InferType<typeof schema>;

export default function RideDriverExecutionForm({ rideId, execution, onSuccess }: Props) {
  const router = useRouter();
  const showSnack = useSnack();
  const { user } = useAuth();
  
  // Check if current user is a driver (should not see turnover/various compensation)
  const isDriverRole = user?.roles?.includes('driver');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const submitExecutionMutation = useSubmitExecution();
  const deleteExecutionMutation = useDeleteMyExecution();
  const { data: files, refetch: refetchFiles } = useMyExecutionFiles(rideId);
  
  const uploadFileMutation = useUploadExecutionFile();
  const deleteFileMutation = useDeleteExecutionFile();
  const downloadFileMutation = useDownloadExecutionFile();

  const {
    control, 
    handleSubmit, 
    formState: { errors }, 
    reset, 
    watch, 
    setValue,
    setError,
    clearErrors
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      actualStartTime: execution?.actualStartTime ?? '',
      actualEndTime: execution?.actualEndTime ?? '',
      actualRestTime: execution?.actualRestTime ?? '',
      containerWaitingTime: normalizeTimeForInput(execution?.containerWaitingTime),
      startKilometers: execution?.startKilometers ?? undefined,
      endKilometers: execution?.endKilometers ?? undefined,
      actualKilometers: toOptionalNumber(execution?.actualKilometers),
      extraKilometers: toOptionalNumber(execution?.extraKilometers),
      actualCosts: toOptionalNumber(execution?.actualCosts),
      costsDescription: execution?.costsDescription ?? '',
      turnover: toOptionalNumber(execution?.turnover),
      remark: execution?.remark ?? '',
      variousCompensation: toOptionalNumber(execution?.variousCompensation),
    },
  });

  // Reset form when execution data changes
  useEffect(() => {
    if (execution) {
      reset({
        actualStartTime: execution.actualStartTime || '',
        actualEndTime: execution.actualEndTime || '',
        actualRestTime: execution.actualRestTime || '',
      containerWaitingTime: normalizeTimeForInput(execution.containerWaitingTime),
        startKilometers: execution.startKilometers ?? undefined,
        endKilometers: execution.endKilometers ?? undefined,
        actualKilometers: toOptionalNumber(execution.actualKilometers),
        extraKilometers: toOptionalNumber(execution.extraKilometers),
        actualCosts: toOptionalNumber(execution.actualCosts),
        costsDescription: execution.costsDescription || '',
        turnover: toOptionalNumber(execution.turnover),
        remark: execution.remark || '',
        variousCompensation: toOptionalNumber(execution.variousCompensation)
      });
    }
  }, [execution, reset]);

  const startKilometers = watch('startKilometers');
  const endKilometers = watch('endKilometers');

  useEffect(() => {
    const start = parseNumber(startKilometers);
    const end = parseNumber(endKilometers);

    const hasStart = start !== undefined;
    const hasEnd = end !== undefined;

    if (!hasStart || !hasEnd) {
      setValue('actualKilometers', undefined, { shouldValidate: true });
      clearErrors('endKilometers');
      clearErrors('actualKilometers');
      return;
    }

    if (end >= start) {
      const diff = parseFloat((end - start).toFixed(2));
      setValue('actualKilometers', diff, { shouldValidate: true });
      clearErrors('endKilometers');
      clearErrors('actualKilometers');
    } else {
      setValue('actualKilometers', undefined, { shouldValidate: true });
      setError('endKilometers', {
        type: 'manual',
        message: 'End kilometers must be greater than or equal to start kilometers'
      });
    }
  }, [startKilometers, endKilometers, setValue, setError, clearErrors]);

  const onSubmit = async (data: FormValues) => {
    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      showSnack({ text: 'Please fix the validation errors before submitting', severity: 'error' });
      return;
    }

    try {
      if (data.actualKilometers == null) {
        showSnack({ text: 'Please enter start and end odometer readings to calculate total kilometers', severity: 'error' });
        return;
      }

      // Convert pending files to base64 for submission
      const filesData = await Promise.all(
        pendingFiles.map(async (file) => ({
          fileName: file.name,
          contentType: file.type,
          fileDataBase64: await fileToBase64(file)
        }))
      );

      const { actualKilometers, containerWaitingTime, ...rest } = data;

      const sanitizedData = {
        ...rest,
        extraKilometers: rest.extraKilometers ?? undefined,
        actualCosts: rest.actualCosts ?? undefined,
        turnover: rest.turnover ?? undefined,
        variousCompensation: rest.variousCompensation ?? undefined,
      };

      const submissionData: SubmitExecutionRequest = {
        ...sanitizedData,
        actualKilometers: actualKilometers ?? undefined,
        containerWaitingTime: normalizeTimeForSubmission(containerWaitingTime),
        files: filesData.length > 0 ? filesData : undefined,
      };

      await submitExecutionMutation.mutateAsync({ rideId, data: submissionData });
      
      // Clear pending files after successful submission
      setPendingFiles([]);
      setSelectedFile(null);
      
      showSnack({
        text: `Execution submitted successfully${filesData.length > 0 ? ` with ${filesData.length} file(s)` : ''}!`,
        severity: 'success',
      });
      
      // Navigate back to rides list for drivers
      if (isDriverRole) {
        setTimeout(() => router.push('/driver/rides'), 1000);
      }
      
      onSuccess?.();
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to submit execution', severity: 'error' });
    }
  };

  const handleDeleteExecution = async () => {
    try {
      await deleteExecutionMutation.mutateAsync(rideId);
      showSnack({ text: 'Execution deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      
      // Navigate back to rides list for drivers
      if (isDriverRole) {
        setTimeout(() => router.push('/driver/rides'), 1000);
      }
      
      onSuccess?.();
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to delete execution', severity: 'error' });
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddFileToPending = () => {
    if (!selectedFile) {
      showSnack({ text: 'Please select a file first', severity: 'error' });
      return;
    }

    // Check if file already exists in pending
    if (pendingFiles.some(f => f.name === selectedFile.name && f.size === selectedFile.size)) {
      showSnack({ text: 'This file is already added', severity: 'warning' });
      return;
    }

    setPendingFiles(prev => [...prev, selectedFile]);
    setSelectedFile(null);
    setFileInputKey(prev => prev + 1); // Force file input reset
    showSnack({ text: `File "${selectedFile.name}" added to submission`, severity: 'success' });
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    showSnack({ text: 'File removed from submission', severity: 'info' });
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showSnack({ text: 'Please select a file first', severity: 'error' });
      return;
    }

    if (!rideId) {
      showSnack({ text: 'Cannot upload file: No ride ID available. Please submit execution first.', severity: 'error' });
      return;
    }

    try {
      await uploadFileMutation.mutateAsync({ rideId, file: selectedFile });
      showSnack({ text: `File "${selectedFile.name}" uploaded successfully!`, severity: 'success' });
      setSelectedFile(null);
      setFileInputKey(prev => prev + 1); // Force file input reset
      
      // Force refresh the files list
      await refetchFiles();
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to upload file', severity: 'error' });
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteFileMutation.mutateAsync({ rideId, fileId });
      showSnack({ text: 'File deleted successfully', severity: 'success' });
      
      // Reset file input to allow re-uploading same file
      setSelectedFile(null);
      setFileInputKey(prev => prev + 1);
      
      // Force refresh the files list
      await refetchFiles();
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to delete file', severity: 'error' });
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      await downloadFileMutation.mutateAsync({ rideId, fileId, fileName });
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to download file', severity: 'error' });
    }
  };

  const canDelete = !!execution && (execution.status === 0 || execution.status === 2); // Pending or Rejected
  const isReadOnly = execution?.status === 1; // Approved

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Time Fields */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Work Time
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Controller
              name="actualStartTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Start Time *"
                  type="time"
                  fullWidth
                  required
                  error={!!errors.actualStartTime}
                  helperText={errors.actualStartTime?.message}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="actualEndTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="End Time *"
                  type="time"
                  fullWidth
                  required
                  error={!!errors.actualEndTime}
                  helperText={errors.actualEndTime?.message}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="actualRestTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Rest Time *"
                  type="time"
                  fullWidth
                  required
                  error={!!errors.actualRestTime}
                  helperText={errors.actualRestTime?.message}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="containerWaitingTime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Container Waiting Time"
                  type="time"
                  fullWidth
                  error={!!errors.containerWaitingTime}
                  helperText={
                    errors.containerWaitingTime?.message ??
                    'Optional: record waiting time for container transports'
                  }
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                  inputProps={{ step: 60 }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          {/* Distance and Costs */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Distance & Costs
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="startKilometers"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Start Odometer *"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.startKilometers}
                  helperText={errors.startKilometers?.message}
                  disabled={isReadOnly}
                  inputProps={{ step: '0.1', min: 0 }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="endKilometers"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="End Odometer *"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.endKilometers}
                  helperText={errors.endKilometers?.message}
                  disabled={isReadOnly}
                  inputProps={{ step: '0.1', min: 0 }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="actualKilometers"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Total Kilometers *"
                  type="number"
                  fullWidth
                  error={!!errors.actualKilometers}
                  helperText={
                    errors.actualKilometers?.message ??
                    (field.value != null ? 'Calculated automatically' : 'Enter start and end readings')
                  }
                  disabled={isReadOnly}
                  InputProps={{ readOnly: true }}
                  InputLabelProps={{ shrink: true }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="extraKilometers"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Extra Kilometers"
                  type="number"
                  fullWidth
                  error={!!errors.extraKilometers}
                  helperText={errors.extraKilometers?.message}
                  disabled={isReadOnly}
                  inputProps={{ step: '0.1', min: 0 }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="actualCosts"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Costs (€)"
                  type="number"
                  fullWidth
                  error={!!errors.actualCosts}
                  helperText={errors.actualCosts?.message}
                  disabled={isReadOnly}
                  inputProps={{ step: '0.01', min: 0 }}
                  value={field.value ?? ''}
                />
              )}
            />
          </Grid>

          {/* Turnover - Admin only */}
          {!isDriverRole && (
            <Grid item xs={12} sm={6}>
              <Controller
                name="turnover"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Turnover (€)"
                    type="number"
                    fullWidth
                    error={!!errors.turnover}
                    helperText={errors.turnover?.message}
                    disabled={isReadOnly}
                  inputProps={{ step: '0.01', min: 0 }}
                  value={field.value ?? ''}
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Controller
              name="costsDescription"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Costs Description"
                  multiline
                  rows={2}
                  fullWidth
                  placeholder="Fuel, tolls, parking, etc."
                  disabled={isReadOnly}
                />
              )}
            />
          </Grid>

          {/* Additional Fields */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
          </Grid>

          {/* Various Compensation - Admin only */}
          {!isDriverRole && (
            <Grid item xs={12} sm={6}>
              <Controller
                name="variousCompensation"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Various Compensation (€)"
                    type="number"
                    fullWidth
                    error={!!errors.variousCompensation}
                    helperText={errors.variousCompensation?.message}
                    disabled={isReadOnly}
                  inputProps={{ step: '0.01', min: 0 }}
                  value={field.value ?? ''}
                  />
                )}
              />
            </Grid>
          )}


          <Grid item xs={12}>
            <Controller
              name="remark"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Remarks"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Any additional notes about this ride..."
                  disabled={isReadOnly}
                />
              )}
            />
          </Grid>


          {/* File Attachments Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              File Attachments
            </Typography>

            {/* File Upload */}
            {!isReadOnly && (
              <Box mb={3}>
                <input
                  key={fileInputKey}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <Box display="flex" gap={2} alignItems="center" mb={2}>
                  <label htmlFor="file-upload">
                    <Button variant="outlined" component="span" startIcon={<AttachFileIcon />}>
                      Choose File
                    </Button>
                  </label>
                  {selectedFile && (
                    <>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </Typography>
                      {!execution ? (
                        <Button
                          variant="contained"
                          onClick={handleAddFileToPending}
                          startIcon={<AttachFileIcon />}
                        >
                          Add to Submission
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={handleFileUpload}
                          disabled={uploadFileMutation.isPending}
                          startIcon={uploadFileMutation.isPending ? <CircularProgress size={20} /> : <UploadIcon />}
                        >
                          {uploadFileMutation.isPending ? 'Uploading...' : 'Upload Now'}
                        </Button>
                      )}
                    </>
                  )}
                </Box>

                {/* Pending Files (for new submissions) */}
                {!execution && pendingFiles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                      Files to Submit ({pendingFiles.length})
                    </Typography>
                    <List sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                      {pendingFiles.map((file, index) => (
                        <ListItem key={index} divider={index < pendingFiles.length - 1}>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                📎 {file.name}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">
                                {(file.size / 1024).toFixed(1)} KB • Will be uploaded with submission
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              onClick={() => handleRemovePendingFile(index)}
                              color="error"
                              title="Remove from submission"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Info message for new executions */}
                {!execution && pendingFiles.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      💡 You can attach files (receipts, photos, documents) and submit everything together!
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* Files List */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Uploaded Files ({files?.length || 0})
              </Typography>
              {files && files.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {files.map((file, index) => (
                    <ListItem key={file.id} divider={index < files.length - 1}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            📎 {file.fileName}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'} • 
                            {file.uploadedAt ? ` Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}` : ' Recently uploaded'}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => handleFileDownload(file.id, file.fileName)}
                          disabled={downloadFileMutation.isPending}
                          title="Download file"
                        >
                          <DownloadIcon />
                        </IconButton>
                        {!isReadOnly && (
                          <IconButton
                            onClick={() => handleFileDelete(file.id)}
                            disabled={deleteFileMutation.isPending}
                            color="error"
                            title="Delete file"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center', 
                    bgcolor: 'grey.50', 
                    borderRadius: 1, 
                    border: '1px dashed', 
                    borderColor: 'grey.300' 
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    📎 No files uploaded yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload receipts, photos, or documents related to this ride
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} mt={2}>
              {!isReadOnly && (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitExecutionMutation.isPending}
                  startIcon={submitExecutionMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                  {execution ? 'Update Execution' : 'Submit Execution'}
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleteExecutionMutation.isPending}
                >
                  Delete Execution
                </Button>
              )}

              {/* Dispute Button - show for rejected executions or existing disputes */}
              {(execution?.status === 2 || execution?.status === 3) && isDriverRole && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => setDisputeDialogOpen(true)}
                >
                  {execution?.status === 2 ? '🚨 Dispute Rejection' : '🚨 View Dispute'}
                </Button>
              )}

              {execution?.status !== undefined && (
                <Chip 
                  label={execution.status === 0 ? 'Pending' : execution.status === 1 ? 'Approved' : execution.status === 2 ? 'Rejected' : 'Dispute'}
                  color={execution.status === 0 ? 'warning' : execution.status === 1 ? 'success' : execution.status === 2 ? 'error' : 'secondary'}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Execution</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this execution? This action cannot be undone.
            All uploaded files will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteExecution} 
            color="error" 
            disabled={deleteExecutionMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dispute Dialog */}
      <RideExecutionDisputeDialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
        rideId={rideId}
        executionStatus={execution?.status === 0 ? 'Pending' : execution?.status === 1 ? 'Approved' : execution?.status === 2 ? 'Rejected' : 'Dispute'}
        rideInfo={{
          plannedDate: execution?.submittedAt || new Date().toISOString(),
          tripNumber: `Ride ${rideId.slice(0, 8)}`,
        }}
      />
    </Box>
  );
}

