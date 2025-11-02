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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Euro as EuroIcon
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
import { useSnack } from '@/providers/SnackProvider';

interface Props {
  ride: RideWithExecutions;
}

export default function RideExecutionApprovalCard({ ride }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<RideExecution | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [newComment, setNewComment] = useState('');

  const showSnack = useSnack();
  const approveExecutionMutation = useApproveExecution();
  const bulkApproveMutation = useBulkApproveExecutions();
  const rejectExecutionMutation = useRejectExecution();
  const addCommentMutation = useAddExecutionComment();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Dispute': return 'secondary';
      default: return 'default';
    }
  };

  const getCompletionStatusColor = (status: string) => {
    switch (status) {
      case 'none': return 'default';
      case 'partial': return 'warning';
      case 'complete': return 'info';
      case 'approved': return 'success';
      default: return 'default';
    }
  };

  const handleApproveExecution = async (execution: RideExecution) => {
    try {
      await approveExecutionMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: execution.driverId
      });
      showSnack(`${execution.driverFirstName} ${execution.driverLastName}'s execution approved`, 'success');
    } catch (error: any) {
      showSnack(error.message || 'Failed to approve execution', 'error');
    }
  };

  const handleBulkApprove = async () => {
    try {
      const result = await bulkApproveMutation.mutateAsync(ride.rideId);
      showSnack(`Approved ${result?.approvedCount || 0} execution(s) successfully`, 'success');
    } catch (error: any) {
      showSnack(error.message || 'Failed to bulk approve executions', 'error');
    }
  };

  const handleRejectExecution = async () => {
    if (!selectedExecution) return;

    try {
      await rejectExecutionMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: selectedExecution.driverId,
        comment: rejectComment || undefined
      });
      showSnack(`${selectedExecution.driverFirstName} ${selectedExecution.driverLastName}'s execution rejected`, 'success');
      setRejectDialogOpen(false);
      setRejectComment('');
      setSelectedExecution(null);
    } catch (error: any) {
      showSnack(error.message || 'Failed to reject execution', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!selectedExecution || !newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        rideId: ride.rideId,
        driverId: selectedExecution.driverId,
        comment: newComment.trim()
      });
      showSnack('Comment added successfully', 'success');
      setCommentDialogOpen(false);
      setNewComment('');
      setSelectedExecution(null);
    } catch (error: any) {
      showSnack(error.message || 'Failed to add comment', 'error');
    }
  };

  const pendingExecutions = ride.executions.filter(e => e.status === 'Pending');
  const hasPendingExecutions = pendingExecutions.length > 0;

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Ride Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                {ride.tripNumber || `Ride ${ride.rideId.slice(0, 8)}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dayjs(ride.plannedDate).format('dddd, MMMM D, YYYY')} • {ride.plannedStartTime} - {ride.plannedEndTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ride.routeFromName} → {ride.routeToName} • {ride.clientName}
              </Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Chip 
                label={ride.executionCompletionStatus}
                color={getCompletionStatusColor(ride.executionCompletionStatus)}
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

          {/* Executions Summary */}
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {ride.executions.map((execution) => (
              <Chip
                key={execution.executionId}
                label={`${execution.driverFirstName} ${execution.driverLastName} (${execution.status})`}
                color={getStatusColor(execution.status)}
                size="small"
                variant={execution.isPrimary ? 'filled' : 'outlined'}
              />
            ))}
          </Box>

          {/* Bulk Actions */}
          {hasPendingExecutions && (
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
              >
                {bulkApproveMutation.isPending ? 'Approving...' : `Approve All (${pendingExecutions.length})`}
              </Button>
            </Box>
          )}

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Driver Executions
            </Typography>
            
            <List disablePadding>
              {ride.executions.map((execution) => (
                <ExecutionListItem
                  key={execution.executionId}
                  execution={execution}
                  rideId={ride.rideId}
                  onApprove={() => handleApproveExecution(execution)}
                  onReject={() => {
                    setSelectedExecution(execution);
                    setRejectDialogOpen(true);
                  }}
                  onComment={() => {
                    setSelectedExecution(execution);
                    setCommentDialogOpen(true);
                  }}
                  isLoading={approveExecutionMutation.isPending}
                />
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reject Execution - {selectedExecution?.driverFirstName} {selectedExecution?.driverLastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason (Optional)"
            multiline
            rows={3}
            fullWidth
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Explain why this execution is being rejected..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectExecution}
            color="error"
            variant="contained"
            disabled={rejectExecutionMutation.isPending}
          >
            {rejectExecutionMutation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add Comment - {selectedExecution?.driverFirstName} {selectedExecution?.driverLastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Comment"
            multiline
            rows={3}
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment about this execution..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddComment}
            variant="contained"
            disabled={addCommentMutation.isPending || !newComment.trim()}
          >
            {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Individual execution list item component
interface ExecutionListItemProps {
  execution: RideExecution;
  rideId: string;
  onApprove: () => void;
  onReject: () => void;
  onComment: () => void;
  isLoading: boolean;
}

function ExecutionListItem({ 
  execution, 
  rideId, 
  onApprove, 
  onReject, 
  onComment, 
  isLoading 
}: ExecutionListItemProps) {
  const { data: comments } = useExecutionComments(rideId, execution.driverId);
  
  return (
    <ListItem divider sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
        <Box flex={1}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon fontSize="small" />
                <Typography variant="body1" fontWeight={execution.isPrimary ? 600 : 400}>
                  {execution.driverFirstName} {execution.driverLastName}
                  {execution.isPrimary && ' (Primary)'}
                </Typography>
                <Chip 
                  label={execution.status}
                  color={getStatusColor(execution.status)}
                  size="small"
                />
              </Box>
            }
            secondary={
              <Box display="flex" gap={2} mt={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon fontSize="small" />
                  <Typography variant="body2">
                    {execution.decimalHours}h
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <EuroIcon fontSize="small" />
                  <Typography variant="body2">
                    €{execution.totalCompensation.toFixed(2)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Submitted: {dayjs(execution.submittedAt).format('MMM D, HH:mm')}
                </Typography>
              </Box>
            }
          />
        </Box>
        
        <ListItemSecondaryAction>
          <Box display="flex" gap={1}>
            <IconButton 
              onClick={onComment}
              size="small"
              title="Add comment"
            >
              <CommentIcon />
            </IconButton>
            {execution.status === 'Pending' && (
              <>
                <IconButton 
                  onClick={onApprove}
                  size="small"
                  color="success"
                  disabled={isLoading}
                  title="Approve execution"
                >
                  <ApproveIcon />
                </IconButton>
                <IconButton 
                  onClick={onReject}
                  size="small"
                  color="error"
                  disabled={isLoading}
                  title="Reject execution"
                >
                  <RejectIcon />
                </IconButton>
              </>
            )}
          </Box>
        </ListItemSecondaryAction>
      </Box>

      {/* Comments */}
      {comments && comments.length > 0 && (
        <Box mt={1} pl={4}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Comments ({comments.length})
          </Typography>
          {comments.slice(0, 2).map((comment) => (
            <Alert key={comment.id} severity="info" sx={{ mt: 0.5, py: 0 }}>
              <Typography variant="body2">
                <strong>{comment.userFirstName} {comment.userLastName}:</strong> {comment.comment}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(comment.createdAt).format('MMM D, HH:mm')}
              </Typography>
            </Alert>
          ))}
          {comments.length > 2 && (
            <Typography variant="caption" color="text.secondary">
              +{comments.length - 2} more comments
            </Typography>
          )}
        </Box>
      )}
    </ListItem>
  );
}

function getStatusColor(status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" {
  switch (status) {
    case 'Pending': return 'warning';
    case 'Approved': return 'success';
    case 'Rejected': return 'error';
    case 'Dispute': return 'secondary';
    default: return 'default';
  }
}
