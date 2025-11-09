'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Grid,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableRow,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Euro as EuroIcon,
  AttachFile as FileIcon,
  AccessTime as TimeIcon,
  LocalShipping as TruckIcon,
  Business as ClientIcon,
  DirectionsCar as KmIcon,
  Receipt as CostIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { 
  RideWithExecutions, 
  RideExecution
} from '@/types/rideExecutionApproval';
import {
  useApproveExecution,
  useBulkApproveExecutions,
  useRejectExecution,
  useAddExecutionComment,
  useExecutionComments
} from '@/hooks/useRideExecutionApproval';
import {
  useDriverExecutionDisputes,
  useAddDisputeComment,
  useCloseExecutionDispute
} from '@/hooks/useRideExecutionDisputes';
import { useSnack } from '@/providers/SnackProvider';

interface Props {
  ride: RideWithExecutions;
}

export default function RideExecutionApprovalCard({ ride }: Props) {
  const showSnack = useSnack();
  const [expanded, setExpanded] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<RideExecution | null>(null);
  const [commentText, setCommentText] = useState('');
  const [disputeCommentText, setDisputeCommentText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionType, setResolutionType] = useState<'accept' | 'reject'>('reject');
  
  // Ref for comments container to handle scrolling
  const commentsContainerRef = React.useRef<HTMLDivElement>(null);

  // Mutations
  const approveMutation = useApproveExecution();
  const bulkApproveMutation = useBulkApproveExecutions();
  const rejectMutation = useRejectExecution();
  const addCommentMutation = useAddExecutionComment();
  const addDisputeCommentMutation = useAddDisputeComment();
  const closeDisputeMutation = useCloseExecutionDispute();

  // Comments query
  const { data: comments, isLoading: commentsLoading } = useExecutionComments(
    ride.rideId,
    selectedExecution?.driverId || ''
  );

  // Disputes query
  const { data: disputes, isLoading: disputesLoading } = useDriverExecutionDisputes(
    ride.rideId,
    selectedExecution?.driverId || ''
  );

  // Auto-scroll to bottom when comments are loaded or dialog opens
  React.useEffect(() => {
    if (commentDialogOpen && comments && comments.length > 0 && commentsContainerRef.current) {
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [commentDialogOpen, comments]);

  const handleApprove = async (execution: RideExecution) => {
    try {
      await approveMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: execution.driverId
      });
      showSnack({ text: 'Execution approved successfully', severity: 'success' });
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to approve execution', severity: 'error' });
    }
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApproveMutation.mutateAsync(ride.rideId);
      showSnack({ text: 'All executions approved successfully', severity: 'success' });
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to approve executions', severity: 'error' });
    }
  };

  const handleReject = async (execution: RideExecution) => {
    try {
      await rejectMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: execution.driverId,
        comment: commentText
      });
      showSnack({ text: 'Execution rejected successfully', severity: 'success' });
      setCommentDialogOpen(false);
      setCommentText('');
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to reject execution', severity: 'error' });
    }
  };

  const handleAddComment = async () => {
    if (!selectedExecution || !commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: selectedExecution.driverId,
        comment: commentText
      });
      showSnack({ text: 'Comment added successfully', severity: 'success' });
      setCommentText('');
      
      // Scroll to bottom of comments after adding new comment
      setTimeout(() => {
        if (commentsContainerRef.current) {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error: any) {
      showSnack({ text: error.message || 'Failed to add comment', severity: 'error' });
    }
  };

  const openCommentDialog = (execution: RideExecution) => {
    setSelectedExecution(execution);
    setCommentDialogOpen(true);
    setCommentText('');
  };

  const closeCommentDialog = () => {
    setCommentDialogOpen(false);
    setSelectedExecution(null);
    setCommentText('');
  };

  const openDisputeDialog = (execution: RideExecution) => {
    setSelectedExecution(execution);
    setDisputeDialogOpen(true);
    setDisputeCommentText('');
    setResolutionNotes('');
    setResolutionType('reject'); // Default to reject
  };

  const closeDisputeDialog = () => {
    setDisputeDialogOpen(false);
    setSelectedExecution(null);
    setDisputeCommentText('');
    setResolutionNotes('');
    setResolutionType('reject');
  };

  const handleAddDisputeComment = async () => {
    if (!selectedExecution || !disputeCommentText.trim()) return;

    const activeDispute = disputes?.find(d => d.status === 'Open');
    if (!activeDispute) {
      showSnack('No active dispute found', 'error');
      return;
    }

    try {
      await addDisputeCommentMutation.mutateAsync({
        disputeId: activeDispute.id,
        request: { body: disputeCommentText }
      });
      showSnack('Comment added to dispute', 'success');
      setDisputeCommentText('');
    } catch (error: any) {
      showSnack(error.message || 'Failed to add dispute comment', 'error');
    }
  };

  const handleCloseDispute = async () => {
    if (!selectedExecution || !resolutionNotes.trim()) return;

    const activeDispute = disputes?.find(d => d.status === 'Open');
    if (!activeDispute) {
      showSnack('No active dispute found', 'error');
      return;
    }

    try {
      await closeDisputeMutation.mutateAsync({
        disputeId: activeDispute.id,
        request: { 
          resolutionType,
          resolutionNotes 
        }
      });
      
      const resolutionMessage = resolutionType === 'accept' 
        ? 'Dispute accepted - Execution has been approved' 
        : 'Dispute rejected - Execution remains rejected';
      
      showSnack(resolutionMessage, 'success');
      closeDisputeDialog();
    } catch (error: any) {
      showSnack(error.message || 'Failed to resolve dispute', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Dispute': return 'secondary';
      default: return 'default';
    }
  };

  const pendingExecutions = ride.executions.filter(exec => exec.status === 'Pending');
  const canBulkApprove = pendingExecutions.length > 1;

  return (
    <>
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          {/* Header - Ride Information */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                <TruckIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                {ride.tripNumber ? `Trip ${ride.tripNumber}` : `Ride ${ride.rideId.slice(0, 8)}`}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <TimeIcon sx={{ mr: 0.5, fontSize: 16, verticalAlign: 'middle' }} />
                    {dayjs(ride.plannedDate).format('MMM D, YYYY')} • {ride.plannedStartTime}-{ride.plannedEndTime}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <ClientIcon sx={{ mr: 0.5, fontSize: 16, verticalAlign: 'middle' }} />
                    {ride.clientName}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                📍 {ride.routeFromName} → {ride.routeToName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🚚 {ride.truckLicensePlate}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={ride.executionCompletionStatus.toUpperCase()} 
                color={ride.executionCompletionStatus === 'complete' ? 'success' : 'warning'}
                size="small" 
              />
              <IconButton 
                onClick={() => setExpanded(!expanded)}
                size="small"
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Driver Executions - Main Cards */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            👥 Driver Executions ({ride.executions.length})
          </Typography>
          
          <Stack spacing={2} sx={{ mb: 2 }}>
            {ride.executions.map((execution) => (
              <ExecutionSummaryCard
                key={execution.executionId}
                execution={execution}
                rideId={ride.rideId}
                onApprove={() => handleApprove(execution)}
                onReject={() => openCommentDialog(execution)}
                onComment={() => openCommentDialog(execution)}
                onDispute={() => openDisputeDialog(execution)}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
              />
            ))}
          </Stack>

          {/* Bulk Actions */}
          {canBulkApprove && (
            <Box display="flex" gap={1} mb={2}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={bulkApproveMutation.isPending ? <CircularProgress size={16} /> : <ApproveIcon />}
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
              >
                Approve All Pending ({pendingExecutions.length})
              </Button>
            </Box>
          )}

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              📋 Detailed Execution Information
            </Typography>
            {ride.executions.map((execution) => (
              <Box key={execution.executionId} sx={{ mb: 3 }}>
                <ExecutionDetailView execution={execution} />
              </Box>
            ))}
          </Collapse>
        </CardContent>
      </Card>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={closeCommentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          💬 {selectedExecution ? `${selectedExecution.driverFirstName} ${selectedExecution.driverLastName}` : 'Execution'} - Comments
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Add Comment"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Add your comment or reason for rejection..."
          />
          
          {/* Previous Comments */}
          {commentsLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={20} />
            </Box>
          ) : comments && comments.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Previous Comments ({comments.length})
              </Typography>
              <Box 
                ref={commentsContainerRef}
                sx={{ 
                  maxHeight: 300, 
                  overflowY: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  bgcolor: 'grey.25'
                }}
              >
                {comments
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Sort by oldest first
                  .map((comment, index) => (
                  <Box 
                    key={comment.id} 
                    sx={{ 
                      mb: 1, 
                      p: 2, 
                      bgcolor: 'background.paper', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      <strong>{comment.userFirstName} {comment.userLastName}</strong> • {dayjs(comment.createdAt).format('MMM D, YYYY HH:mm')}
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {comment.comment}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Previous Comments</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No comments yet. Be the first to add a comment!
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCommentDialog}>Cancel</Button>
          <Button 
            onClick={handleAddComment} 
            disabled={!commentText.trim() || addCommentMutation.isPending}
            startIcon={addCommentMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            Add Comment
          </Button>
          {selectedExecution?.status === 'Pending' && (
            <Button 
              onClick={() => handleReject(selectedExecution)}
              color="error"
              disabled={rejectMutation.isPending}
              startIcon={rejectMutation.isPending ? <CircularProgress size={16} /> : <RejectIcon />}
            >
              Reject with Comment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onClose={closeDisputeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          🚨 Execution Dispute - {selectedExecution ? `${selectedExecution.driverFirstName} ${selectedExecution.driverLastName}` : 'Driver'}
        </DialogTitle>
        <DialogContent>
          {disputesLoading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress size={24} />
            </Box>
          ) : disputes && disputes.length > 0 ? (
            <Box>
              {disputes.map((dispute) => (
                <Box key={dispute.id} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, bgcolor: 'warning.50' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Dispute Reason:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {dispute.reason}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    Created: {dayjs(dispute.createdAtUtc).format('MMM D, YYYY HH:mm')} • Status: <Chip label={dispute.status} color={dispute.status === 'Open' ? 'warning' : 'default'} size="small" />
                  </Typography>

                  {/* Dispute Comments */}
                  {dispute.comments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Discussion ({dispute.comments.length})
                      </Typography>
                      <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                        {dispute.comments
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
                    </Box>
                  )}

                  {/* Add Comment to Dispute */}
                  {dispute.status === 'Open' && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Add a response to this dispute..."
                        value={disputeCommentText}
                        onChange={(e) => setDisputeCommentText(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleAddDisputeComment}
                        disabled={!disputeCommentText.trim() || addDisputeCommentMutation.isPending}
                        startIcon={addDisputeCommentMutation.isPending ? <CircularProgress size={16} /> : null}
                      >
                        Add Response
                      </Button>
                    </Box>
                  )}

                  {/* Resolve Dispute */}
                  {dispute.status === 'Open' && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Resolve Dispute
                      </Typography>
                      
                      {/* Resolution Type Selection */}
                      <FormControl component="fieldset" sx={{ mb: 2 }}>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                          Resolution Decision *
                        </FormLabel>
                        <RadioGroup
                          value={resolutionType}
                          onChange={(e) => setResolutionType(e.target.value as 'accept' | 'reject')}
                          sx={{ gap: 1 }}
                        >
                          <FormControlLabel 
                            value="accept" 
                            control={<Radio />} 
                            label={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                                  ✅ Accept Dispute (Driver was right)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  The execution will be approved
                                </Typography>
                              </Box>
                            }
                            sx={{ mb: 1 }}
                          />
                          <FormControlLabel 
                            value="reject" 
                            control={<Radio />} 
                            label={
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                  ❌ Reject Dispute (Admin was right)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  The execution will remain rejected
                                </Typography>
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </FormControl>

                      {/* Resolution Notes */}
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Resolution Notes *"
                        placeholder="Explain your decision..."
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      
                      <Button
                        variant="contained"
                        color={resolutionType === 'accept' ? 'success' : 'error'}
                        onClick={handleCloseDispute}
                        disabled={!resolutionNotes.trim() || closeDisputeMutation.isPending}
                        startIcon={closeDisputeMutation.isPending ? <CircularProgress size={16} /> : null}
                      >
                        {resolutionType === 'accept' ? 'Accept & Approve Execution' : 'Reject & Keep Rejected'}
                      </Button>
                    </Box>
                  )}

                  {dispute.status === 'Closed' && (
                    <Box sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: dispute.resolutionType === 'Accept' ? 'success.50' : 'error.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: dispute.resolutionType === 'Accept' ? 'success.main' : 'error.main'
                    }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ 
                        fontWeight: 600,
                        color: dispute.resolutionType === 'Accept' ? 'success.main' : 'error.main'
                      }}>
                        {dispute.resolutionType === 'Accept' ? '✅ Dispute Accepted' : '❌ Dispute Rejected'}
                      </Typography>
                      
                      <Chip 
                        label={dispute.resolutionType === 'Accept' ? 'Execution Approved' : 'Execution Rejected'}
                        color={dispute.resolutionType === 'Accept' ? 'success' : 'error'}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      
                      {dispute.resolutionNotes && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          <strong>Resolution Notes:</strong> {dispute.resolutionNotes}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary" display="block">
                        <strong>Resolved by:</strong> {dispute.resolvedByName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <strong>Resolved at:</strong> {dayjs(dispute.closedAtUtc).format('MMM D, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No disputes found for this execution.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDisputeDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Individual Execution Summary Card Component
interface ExecutionSummaryCardProps {
  execution: RideExecution;
  rideId: string;
  onApprove: () => void;
  onReject: () => void;
  onComment: () => void;
  onDispute: () => void;
  isLoading: boolean;
}

function ExecutionSummaryCard({ 
  execution, 
  rideId, 
  onApprove, 
  onReject, 
  onComment, 
  onDispute,
  isLoading 
}: ExecutionSummaryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Dispute': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 2, 
        bgcolor: execution.status === 'Pending' ? 'warning.50' : 'background.paper',
        border: execution.status === 'Pending' ? '1px solid' : undefined,
        borderColor: execution.status === 'Pending' ? 'warning.main' : undefined
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            <PersonIcon sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />
            {execution.driverFirstName} {execution.driverLastName}
            <Chip 
              label={execution.isPrimary ? 'Primary' : 'Second'} 
              size="small" 
              sx={{ ml: 1 }} 
              color={execution.isPrimary ? 'primary' : 'default'}
            />
          </Typography>
          
          <Box display="flex" alignItems="center" gap={2} mt={1}>
            <Chip 
              label={execution.status} 
              color={getStatusColor(execution.status)} 
              size="small" 
            />
            <Typography variant="body2" color="text.secondary">
              Submitted: {dayjs(execution.submittedAt).format('MMM D, HH:mm')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Key Execution Data */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="primary.main" fontWeight={600}>
              {execution.decimalHours || 0}h
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Hours
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="h6" color="success.main" fontWeight={600}>
              €{execution.totalCompensation?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Compensation
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="body2" fontWeight={500}>
              {(execution.actualKilometers ?? 0).toLocaleString()} km
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Distance
            </Typography>
            {(execution.startKilometers != null || execution.endKilometers != null) && (
              <Typography variant="caption" color="text.secondary" display="block">
                {execution.startKilometers != null ? execution.startKilometers.toLocaleString() : '—'} → {execution.endKilometers != null ? execution.endKilometers.toLocaleString() : '—'}
              </Typography>
            )}
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box textAlign="center">
            <Typography variant="body2" fontWeight={500}>
              €{execution.actualCosts?.toFixed(2) || '0.00'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Costs
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Time Details */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <TimeIcon sx={{ mr: 0.5, fontSize: 14, verticalAlign: 'middle' }} />
          {execution.actualStartTime || '--:--'} - {execution.actualEndTime || '--:--'} 
          {execution.actualRestTime && (
            <span> • Rest: {execution.actualRestTime}</span>
          )}
        </Typography>
      </Box>

      {/* Driver Remarks */}
      {execution.remark && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Driver Comment:
          </Typography>
          <Typography variant="body2">
            "{execution.remark}"
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button
          size="small"
          startIcon={<CommentIcon />}
          onClick={onComment}
        >
          Comment
        </Button>

        {execution.status === 'Dispute' && (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            onClick={onDispute}
          >
            🚨 View Dispute
          </Button>
        )}
        
        {execution.status === 'Pending' && (
          <>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} /> : <RejectIcon />}
              onClick={onReject}
              disabled={isLoading}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={isLoading ? <CircularProgress size={16} /> : <ApproveIcon />}
              onClick={onApprove}
              disabled={isLoading}
            >
              Approve
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
}

// Detailed Execution View Component (for expanded section)
interface ExecutionDetailViewProps {
  execution: RideExecution;
}

function ExecutionDetailView({ execution }: ExecutionDetailViewProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {execution.driverFirstName} {execution.driverLastName} - Detailed Information
      </Typography>
      
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell sx={{ border: 'none', width: 160 }}>Start Time</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.actualStartTime || '—'}</TableCell>
            <TableCell sx={{ border: 'none', width: 160 }}>End Time</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.actualEndTime || '—'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none' }}>Rest Time</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.actualRestTime || '—'}</TableCell>
            <TableCell sx={{ border: 'none' }}>Total Hours</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.decimalHours || 0}h</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none' }}>Start Odometer</TableCell>
            <TableCell sx={{ border: 'none' }}>
              {execution.startKilometers != null ? execution.startKilometers.toLocaleString() : '—'}
            </TableCell>
            <TableCell sx={{ border: 'none' }}>End Odometer</TableCell>
            <TableCell sx={{ border: 'none' }}>
              {execution.endKilometers != null ? execution.endKilometers.toLocaleString() : '—'}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none' }}>Kilometers</TableCell>
            <TableCell sx={{ border: 'none' }}>
              {(execution.actualKilometers ?? 0).toLocaleString()} km
            </TableCell>
            <TableCell sx={{ border: 'none' }}>Extra Kilometers</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.extraKilometers || 0} km</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none' }}>Actual Costs</TableCell>
            <TableCell sx={{ border: 'none' }}>€{execution.actualCosts?.toFixed(2) || '0.00'}</TableCell>
            <TableCell sx={{ border: 'none' }}>Cost Description</TableCell>
            <TableCell sx={{ border: 'none' }}>{execution.costsDescription || '—'}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none' }}>Total Compensation</TableCell>
            <TableCell sx={{ border: 'none' }}>€{execution.totalCompensation?.toFixed(2) || '0.00'}</TableCell>
            <TableCell sx={{ border: 'none' }}>Status</TableCell>
            <TableCell sx={{ border: 'none' }}>
              <Chip label={execution.status} size="small" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Paper>
  );
}