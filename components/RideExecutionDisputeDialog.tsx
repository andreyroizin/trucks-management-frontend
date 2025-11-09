'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';

import { 
  useCreateExecutionDispute, 
  useMyExecutionDisputes, 
  useAddDisputeComment,
  RideExecutionDispute 
} from '@/hooks/useRideExecutionDisputes';
import { useSnack } from '@/providers/SnackProvider';

type Props = {
  open: boolean;
  onClose: () => void;
  rideId: string;
  executionStatus: string;
  rideInfo?: {
    tripNumber?: string;
    plannedDate: string;
    route?: string;
  };
};

const schema = yup.object({
  reason: yup
    .string()
    .required('Please explain why you are disputing this rejection')
    .min(10, 'Please provide at least 10 characters explaining the issue')
});

export default function RideExecutionDisputeDialog({ 
  open, 
  onClose, 
  rideId, 
  executionStatus,
  rideInfo 
}: Props) {
  const showSnack = useSnack();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const errorRef = React.useRef<HTMLDivElement>(null);
  
  // Hooks
  const { data: disputes, isLoading: disputesLoading } = useMyExecutionDisputes(rideId);
  const createDisputeMutation = useCreateExecutionDispute();
  const addCommentMutation = useAddDisputeComment();

  // Check if there's already an open dispute
  const existingDispute = disputes?.find(d => d.status === 'Open');
  const hasOpenDispute = !!existingDispute;

  /* RHF setup */
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (open) {
      setSubmitError(null);
      setShowComments(false);
      setCommentText('');
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (values: { reason: string }) => {
    try {
      setSubmitError(null);
      await createDisputeMutation.mutateAsync({
        rideId,
        request: { reason: values.reason }
      });
      
      showSnack({
        text: 'Dispute created successfully. Your execution status is now "Dispute".',
        severity: 'success',
      });
      reset();
      onClose();
    } catch (e: any) {
      console.error(e);
      setSubmitError(e.message || 'Failed to create dispute');
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleAddComment = async () => {
    if (!existingDispute || !commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        disputeId: existingDispute.id,
        request: { body: commentText }
      });
      
      showSnack({ text: 'Comment added successfully', severity: 'success' });
      setCommentText('');
    } catch (e: any) {
      showSnack({ text: e.message || 'Failed to add comment', severity: 'error' });
    }
  };

  // Can only dispute rejected executions
  const canCreateDispute = executionStatus === 'Rejected' && !hasOpenDispute;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 4,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight={500}>
          🚨 Execution Dispute
        </Typography>
        {rideInfo && (
          <Typography variant="body2" color="text.secondary">
            {rideInfo.tripNumber || `Ride ${rideId.slice(0, 8)}`} • {dayjs(rideInfo.plannedDate).format('dddd, MMMM D, YYYY')}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        {disputesLoading ? (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {/* Current Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Status:
              </Typography>
              <Chip 
                label={executionStatus} 
                color={executionStatus === 'Rejected' ? 'error' : executionStatus === 'Dispute' ? 'warning' : 'default'}
                size="small"
              />
            </Box>

            {/* Existing Dispute */}
            {existingDispute && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                <Typography variant="subtitle2" gutterBottom>
                  📋 Active Dispute (Created {dayjs(existingDispute.createdAtUtc).format('MMM D, YYYY HH:mm')})
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Reason:</strong> {existingDispute.reason}
                </Typography>
                
                {existingDispute.comments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Button 
                      size="small" 
                      onClick={() => setShowComments(!showComments)}
                      sx={{ mb: 1 }}
                    >
                      {showComments ? 'Hide' : 'Show'} Comments ({existingDispute.comments.length})
                    </Button>
                    
                    {showComments && (
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {existingDispute.comments
                          .sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime())
                          .map((comment) => (
                          <Box key={comment.id} sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              <strong>{comment.authorFirstName} {comment.authorLastName}</strong> • {dayjs(comment.createdAtUtc).format('MMM D, HH:mm')}
                            </Typography>
                            <Typography variant="body2">{comment.body}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Add Comment */}
                <Box>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Add a comment to your dispute..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    startIcon={addCommentMutation.isPending ? <CircularProgress size={16} /> : null}
                  >
                    Add Comment
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Create New Dispute Form */}
            {canCreateDispute && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Create New Dispute
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your execution was rejected. If you believe this rejection is incorrect, please explain why below.
                </Typography>

                <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
                  <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Explain why you are disputing this rejection *"
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                        error={!!errors.reason}
                        helperText={errors.reason?.message || 'Please provide detailed information about why the rejection is incorrect'}
                        placeholder="Example: I arrived on time and completed all required work. The rejection reason stating I was late is incorrect..."
                      />
                    )}
                  />
                  <button type="submit" style={{ display: 'none' }} />
                </Box>
              </>
            )}

            {/* Cannot Dispute Messages */}
            {executionStatus !== 'Rejected' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You can only dispute rejected executions. Your current status is "{executionStatus}".
              </Alert>
            )}

            {executionStatus === 'Rejected' && hasOpenDispute && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You already have an open dispute for this execution. You can add comments above to provide additional information.
              </Alert>
            )}

            {submitError && (
              <Box ref={errorRef} sx={{ mt: 2 }}>
                <Alert severity="error" icon={<InfoOutlinedIcon fontSize="small" />}>
                  {submitError}
                </Alert>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, display: 'flex', gap: 2 }}>
        {canCreateDispute && (
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmit(onSubmit)}
            disabled={createDisputeMutation.isPending}
            sx={{ flex: 1 }}
          >
            {createDisputeMutation.isPending ? <CircularProgress size={20} /> : 'Create Dispute'}
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ flex: canCreateDispute ? 1 : 'auto' }}
        >
          {canCreateDispute ? 'Cancel' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
