'use client';

import React, {useMemo, useState} from 'react';
import {Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert} from '@mui/material';
import { useApprovePartRide, useRejectPartRide, useRequestChangesPartRide } from '@/hooks/usePartRideApprovals';

type Approval = {
    id: string;
    status: number;
    updatedAt: string;
    comments?: string | null;
    role: {
        id: string;
        name: string;
    };
    approvedByUser?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
};

type ApprovalActionsProps = {
    userRoles: string[];
    approvals?: Approval[];
    partRideId: string; // needed to pass to the hooks
};

export default function ApprovalActions({ userRoles, approvals, partRideId }: ApprovalActionsProps) {
    const isCustomerAdmin = userRoles.includes('customerAdmin');
    const isDriver = userRoles.includes('driver');
    // --- local modal state for comment + which action ---
    const [openModal, setOpenModal] = useState(false);
    const [actionType, setActionType] = useState<'approve'|'reject'|'changes'|null>(null);
    const [comments, setComments] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // hooks for each action
    const { mutateAsync: approveMutation, isPending: isApproving } = useApprovePartRide();
    const { mutateAsync: rejectMutation, isPending: isRejecting } = useRejectPartRide();
    const { mutateAsync: changesMutation, isPending: isRequestingChanges } = useRequestChangesPartRide();

    // find user approval (by role name)
    const userApproval = approvals?.find(a => a.role?.name === (isDriver ? 'driver' : 'customerAdmin'));
    const userHasApproval = !!userApproval;
    const status = userHasApproval ? userApproval!.status : -1;
    const isPending = status === 0;
    const isApproved = status === 1;
    const isChangesRequested = status === 2;
    const isRejected = status === 3;

    const showApproveButton = useMemo(() => {
        if (isCustomerAdmin) {
            return !userHasApproval || isPending || isRejected || isChangesRequested;
        }
        if (isDriver) {
            return !userHasApproval || isPending || isRejected;
        }
        return false;
    }, [isCustomerAdmin, isDriver, userHasApproval, isPending, isRejected, isChangesRequested]);

    const showChangesRequestedButton = useMemo(() => {
        if (isCustomerAdmin) {
            return !userHasApproval || isPending || isRejected || isApproved;
        }
        return false;
    }, [isCustomerAdmin, userHasApproval, isPending, isRejected]);

    const showRejectButton = useMemo(() => {
        if (isCustomerAdmin) {
            return !userHasApproval || isPending || isChangesRequested || isApproved;
        }
        if (isDriver) {
            return !userHasApproval || isPending || isApproved;
        }
        return false;
    }, [isCustomerAdmin, isDriver, userHasApproval, isPending, isChangesRequested, isApproved]);

    // open a modal for user input
    const handleOpenModal = (type: 'approve'|'reject'|'changes') => {
        setActionType(type);
        setComments('');
        setOpenModal(true);
        setErrorMessage(null);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setActionType(null);
        setComments('');
        setErrorMessage(null);
    };

    // on confirm
    const handleConfirm = async () => {
        if (!actionType) return;
        try {
            const payload = { id: partRideId, comments };
            if (actionType === 'approve') {
                await approveMutation(payload);
            } else if (actionType === 'reject') {
                await rejectMutation(payload);
            } else if (actionType === 'changes') {
                await changesMutation(payload);
            }
            // close the modal
            handleCloseModal();
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.errors?.[0] || err.message || 'Something went wrong.');
            console.error('Action failed:', err);
        }
    };

    // overall loading state
    const isAnyLoading = isApproving || isRejecting || isRequestingChanges;

    if (!isCustomerAdmin && !isDriver) return null;

    return (
        <Box mt={2}>
            <Box display="flex" gap={2}>
                {showApproveButton && (
                    <Button
                        variant="contained"
                        color="success"
                        disabled={isAnyLoading}
                        onClick={() => handleOpenModal('approve')}
                    >
                        Approve
                    </Button>
                )}
                {showChangesRequestedButton && (
                    <Button
                        variant="contained"
                        color="warning"
                        disabled={isAnyLoading}
                        onClick={() => handleOpenModal('changes')}
                    >
                        Request changes
                    </Button>
                )}
                {showRejectButton && (
                    <Button
                        variant="contained"
                        color="error"
                        disabled={isAnyLoading}
                        onClick={() => handleOpenModal('reject')}
                    >
                        Reject
                    </Button>
                )}
            </Box>

            {/* The pop-up window for comment input */}
            <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
                <DialogTitle>{actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Changes Requested'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Comment (optional)"
                        multiline
                        fullWidth
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        margin="normal"
                    />
                    {errorMessage && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        color="primary"
                        disabled={isAnyLoading}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
