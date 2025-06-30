'use client';

import React from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography} from '@mui/material';

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
            <DialogContent sx={{pt: 3, pl: 3, pr: 3}}>
                <Typography variant="h5" gutterBottom>{title}</Typography>
                <Typography variant="subtitle1">{message}</Typography>
            </DialogContent>
            <DialogActions sx={{pb: 3, pl: 3, pr: 3}}>
                <Button fullWidth onClick={onConfirm} color="error" variant="contained">
                    Confirm
                </Button>
                <Button fullWidth onClick={onClose} color="inherit">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
