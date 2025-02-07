'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

type ConfirmModalProps = {
    open: boolean;
    title?: string;
    message?: string;
    onClose: () => void;
    onConfirm: () => void;
};

export default function ConfirmModal({
                                         open,
                                         title = 'Confirm',
                                         message = 'Are you sure?',
                                         onClose,
                                         onConfirm,
                                     }: ConfirmModalProps) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>{message}</DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
}
